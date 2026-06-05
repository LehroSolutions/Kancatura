import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

import { chromium } from "playwright";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = resolve(repoRoot, "output/playwright");
const port = Number(process.env.KANCATURA_E2E_PORT ?? 5199);
const url = `http://127.0.0.1:${port}`;
const channel = process.env.PLAYWRIGHT_CHANNEL ?? "chrome";

mkdirSync(outputDir, { recursive: true });

const server = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
  {
    cwd: repoRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  }
);

let serverLog = "";
server.stdout.on("data", (chunk) => {
  serverLog += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  serverLog += chunk.toString();
});

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Vite exited before serving ${url}\n${serverLog}`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      await delay(350);
    }
  }

  throw new Error(`Timed out waiting for ${url}\n${serverLog}`);
}

async function shutdown() {
  if (server.exitCode === null) {
    server.kill("SIGTERM");
    await Promise.race([
      new Promise((resolveExit) => server.once("exit", resolveExit)),
      delay(2_000).then(() => server.kill("SIGKILL"))
    ]);
  }
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth
  }));

  if (overflow.scrollWidth > overflow.clientWidth + 1 || overflow.bodyScrollWidth > overflow.clientWidth + 1) {
    throw new Error(`${label} has horizontal overflow: ${JSON.stringify(overflow)}`);
  }
}

async function assertNoDirectChildOverlap(page, selector, label) {
  const overlaps = await page.$$eval(selector, (nodes) => {
    const intersects = (a, b) => {
      const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      return width > 0.5 && height > 0.5;
    };

    return nodes.flatMap((node, nodeIndex) => {
      const children = Array.from(node.children)
        .map((child, childIndex) => ({ childIndex, rect: child.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width > 0 && rect.height > 0);
      const nodeOverlaps = [];

      for (let i = 0; i < children.length; i += 1) {
        for (let j = i + 1; j < children.length; j += 1) {
          if (intersects(children[i].rect, children[j].rect)) {
            nodeOverlaps.push({
              nodeIndex,
              a: children[i].childIndex,
              b: children[j].childIndex,
              text: node.textContent?.replace(/\s+/g, " ").trim().slice(0, 120)
            });
          }
        }
      }

      return nodeOverlaps;
    });
  });

  if (overlaps.length > 0) {
    throw new Error(`${label} has overlapping row children: ${JSON.stringify(overlaps.slice(0, 5))}`);
  }
}

async function assertLayoutIntegrity(page, label) {
  await assertNoHorizontalOverflow(page, label);
  await assertNoDirectChildOverlap(
    page,
    ".blocker-row, .checkpoint-row, .evidence-row, .task-row, .document-row, .capability-item",
    label
  );
}

try {
  await waitForServer();

  const browser = await chromium.launch({ channel, headless: true });
  const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator(".sidebar .brand-wordmark p", { hasText: "KANCATURA" }).waitFor();

  // Dismiss onboarding dialog if present (first run)
  const skipButton = page.getByRole("button", { name: "Skip for now" });
  if (await skipButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await skipButton.click();
  }

  await page.locator(".profile-copy p").first().waitFor();
  await page.getByRole("heading", { name: "Founder Studio" }).waitFor();
  await page.getByRole("heading", { name: "Build Your Business" }).waitFor();
  await page.getByRole("heading", { name: "Move from idea to export-ready plan" }).waitFor();
  await assertLayoutIntegrity(page, "dashboard desktop");
  await page.screenshot({ path: resolve(outputDir, "dashboard.png"), fullPage: false });

  await page.getByRole("tab", { name: "Documents" }).click();
  await page.getByRole("heading", { name: "Document Library" }).waitFor();
  await assertLayoutIntegrity(page, "documents desktop");

  await page.getByRole("tab", { name: "Tasks" }).click();
  await page.getByRole("heading", { name: "Upcoming" }).waitFor();
  await assertLayoutIntegrity(page, "tasks desktop");

  await page.getByRole("tab", { name: "Financial Plan" }).click();
  await page.getByRole("heading", { name: "Financial Plan", level: 1 }).waitFor();
  await page.getByRole("heading", { name: "Finance" }).waitFor();
  await assertLayoutIntegrity(page, "financial plan desktop");

  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByRole("heading", { name: "Workspace Mode" }).waitFor();
  await assertLayoutIntegrity(page, "settings desktop");

  await page.setViewportSize({ width: 390, height: 900 });
  await page.reload({ waitUntil: "domcontentloaded" });

  // Dismiss onboarding if it reappears after reload
  const skipMobile = page.getByRole("button", { name: "Skip for now" });
  if (await skipMobile.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipMobile.click();
  }

  await page.getByRole("heading", { name: "Founder Studio" }).waitFor();
  await assertLayoutIntegrity(page, "dashboard mobile");
  await page.screenshot({ path: resolve(outputDir, "dashboard-mobile.png"), fullPage: false });

  await browser.close();
  console.log("Browser smoke passed: Founder Studio rendered, screenshots captured, tabs switched, and layout integrity checked.");
} finally {
  await shutdown();
}
