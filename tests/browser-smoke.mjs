import { spawn } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
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
  ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
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
  const deadline = Date.now() + 120_000;
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

let browser;
try {
  await waitForServer();

  browser = await chromium.launch({ channel, headless: true });
  const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.locator(".sidebar .brand-wordmark p", { hasText: "KANCATURA" }).waitFor();

  // Exercise first-run profile creation through its accessible labels.
  const skipButton = page.getByRole("button", { name: "Skip for now" });
  if (await skipButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await page.getByRole("button", { name: "Get Started", exact: true }).click();
    await page.getByLabel("Business or project name", { exact: true }).fill("Synthetic founder");
    await page.getByLabel("Your role", { exact: true }).fill("Founder");
    await page.getByLabel("Target market", { exact: true }).fill("South African businesses");
    await page.getByRole("button", { name: "Start Building", exact: true }).click();
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
  await page.getByRole("button", { name: "Add Task", exact: true }).click();
  await page.getByLabel("Task label", { exact: true }).fill("Verify workspace recovery");
  await page.getByLabel("Owner", { exact: true }).fill("Release QA");
  await page.getByRole("button", { name: "Create Task", exact: true }).click();
  await page.getByText("Verify workspace recovery", { exact: true }).waitFor();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("tab", { name: /^Tasks/ }).click();
  await page.getByText("Verify workspace recovery", { exact: true }).waitFor();

  await page.getByRole("tab", { name: "Financial Plan" }).click();
  await page.getByRole("heading", { name: "Financial Plan", level: 1 }).waitFor();
  await page.getByRole("heading", { name: "Finance" }).waitFor();
  await assertLayoutIntegrity(page, "financial plan desktop");

  await page.getByRole("tab", { name: "Settings" }).click();
  await page.getByRole("heading", { name: "Workspace Mode" }).waitFor();
  await assertLayoutIntegrity(page, "settings desktop");
  const backupDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  const backup = readFileSync(await (await backupDownload).path());
  const records = JSON.parse(backup.toString());
  assert.ok(records.planTasks.some((task) => task.label === "Verify workspace recovery"));
  assert.ok(records.plan.some((plan) => plan.profileName === "Synthetic founder"), "onboarding profile survives reload and JSON export");
  await page.locator('input[type="file"]').setInputFiles({
    name: "invalid.json", mimeType: "application/json", buffer: Buffer.from('{"planTasks":[{"id":1}]}')
  });
  await page.getByText("Import failed", { exact: true }).waitFor();
  await page.locator('input[type="file"]').setInputFiles({
    name: "backup.json", mimeType: "application/json", buffer: backup
  });
  await page.getByText("Data imported", { exact: true }).waitFor();
  const pdfDownload = page.waitForEvent("download");
  await page.getByRole("tabpanel", { name: "Settings" }).getByRole("button", { name: "Export PDF", exact: true }).click();
  const exportedPdf = await pdfDownload;
  await exportedPdf.saveAs(resolve(outputDir, "workspace.pdf"));
  const pdfBytes = readFileSync(await exportedPdf.path());
  assert.equal(pdfBytes.subarray(0, 5).toString(), "%PDF-");
  const containsText = (text) => pdfBytes.includes(Buffer.from(text));
  assert.ok(containsText("Verify workspace recovery"), "PDF contains the newly persisted task");
  assert.ok(containsText("Release QA"), "PDF contains its owner");
  assert.ok((pdfBytes.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length > 1, "full workspace export spans multiple pages");

  await page.getByRole("tab", { name: "Dashboard", exact: true }).click();
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

  const blockedPage = await browser.newPage();
  await blockedPage.addInitScript(() => {
    indexedDB.open = () => { throw new DOMException("Storage disabled", "SecurityError"); };
  });
  await blockedPage.goto(url);
  await blockedPage.getByRole("heading", { name: "Workspace storage is unavailable" }).waitFor();
  await blockedPage.getByRole("button", { name: "Retry loading workspace" }).waitFor();
  await blockedPage.close();
  const recoverPage = await browser.newPage();
  await recoverPage.addInitScript(() => {
    const originalOpen = indexedDB.open.bind(indexedDB);
    let firstAttempt = true;
    indexedDB.open = (...args) => {
      const request = originalOpen(...args);
      if (firstAttempt) {
        firstAttempt = false;
        request.addEventListener("upgradeneeded", () => request.transaction.abort());
      }
      return request;
    };
  });
  await recoverPage.goto(url);
  await recoverPage.getByRole("heading", { name: "Workspace storage is unavailable" }).waitFor();
  await recoverPage.getByRole("button", { name: "Retry loading workspace" }).click();
  const skipRecovered = recoverPage.getByRole("button", { name: "Skip for now" });
  if (await skipRecovered.isVisible({ timeout: 3000 }).catch(() => false)) await skipRecovered.click();
  await recoverPage.getByRole("heading", { name: "Founder Studio" }).waitFor();
  await recoverPage.close();
  assert.deepEqual(runtimeErrors, []);

  console.log("Browser smoke passed: production UI, task persistence, JSON backup/restore, invalid import, PDF export, storage failure and retry recovery, desktop/mobile layout.");
} finally {
  await browser?.close();
  await shutdown();
}
