import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const dataSource = readFileSync(new URL("../src/data/kancatura.ts", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const schemaSource = readFileSync(new URL("../convex/schema.ts", import.meta.url), "utf8");
const convexFunctionsSource = readFileSync(new URL("../convex/plans.ts", import.meta.url), "utf8");

const railTabs = [
  "Dashboard",
  "Executive Summary",
  "Company Overview",
  "Business Description",
  "Market Analysis",
  "Operating Plan",
  "Marketing & Sales Plan",
  "Financial Plan",
  "Appendix",
  "Documents",
  "Tasks",
  "Notes",
  "Settings"
];

test("left rail is implemented as stateful tabs instead of inert anchors", () => {
  assert.match(appSource, /type WorkspaceTabId =/);
  assert.match(appSource, /const workspaceTabs/);
  assert.match(appSource, /role="tablist"/);
  assert.match(appSource, /aria-selected=/);
  assert.doesNotMatch(appSource, /href="#root"/);

  for (const label of railTabs) {
    assert.ok(appSource.includes(`label: "${label}"`), `missing tab label: ${label}`);
  }
});

test("every non-dashboard tab has a production content surface", () => {
  const requiredContentMarkers = [
    "SectionWorkspace",
    "DocumentsWorkspace",
    "TasksWorkspace",
    "NotesWorkspace",
    "SettingsWorkspace",
    "AppendixWorkspace"
  ];

  for (const marker of requiredContentMarkers) {
    assert.ok(appSource.includes(marker), `missing content component: ${marker}`);
  }
});

test("Founder Studio uses Kancatura-only branding while preserving business plan content", () => {
  const requiredCopy = [
    "KANCATURA",
    "BUSINESS PLAN",
    "Founder Studio",
    "Build Your Business",
    "Guided business builder",
    "Kancatura Workspace",
    "ZAR 2.8M",
    "Month 14",
    "70 - 80%",
    "Business Plan v1.2",
    "SWOT Analysis.pptx",
    "POPIA Compliant"
  ];

  for (const copy of requiredCopy) {
    assert.ok(appSource.includes(copy) || dataSource.includes(copy), `missing founder studio copy: ${copy}`);
  }

  const forbiddenCopy = ["LE" + "HRO", "SOL" + "UTIONS", "John" + " Dlamini", "Founder" + " & CEO", "Le" + "hro Solutions", "Le" + "hroMark"];
  for (const copy of forbiddenCopy) {
    assert.ok(!appSource.includes(copy) && !dataSource.includes(copy), `old brand copy leaked: ${copy}`);
  }
});

test("guided builder workflow data is represented in frontend demo data", () => {
  const requiredTypes = ["BusinessStage", "ReadinessBlocker", "EvidenceItem", "StudioActivity", "ExportCheckpoint"];
  const requiredStages = ["Foundation", "Market Proof", "Operations", "Finance", "Launch", "Export"];
  const requiredComponents = ["FounderStudioView", "StageCard", "BlockerRow", "EvidenceRow", "CheckpointRow"];

  for (const typeName of requiredTypes) {
    assert.ok(dataSource.includes(`type ${typeName}`), `missing data type: ${typeName}`);
  }

  for (const stage of requiredStages) {
    assert.ok(dataSource.includes(stage), `missing builder stage: ${stage}`);
  }

  for (const component of requiredComponents) {
    assert.ok(appSource.includes(component), `missing workflow component: ${component}`);
  }
});

test("Founder Studio stylesheet opens the layout instead of preserving fixed dashboard cards", () => {
  const requiredSelectors = [
    ".sidebar",
    ".studio-grid",
    ".build-lane",
    ".stage-track",
    ".studio-support-grid",
    ".section-studio-grid",
    ".workspace-panel",
    ".evidence-row",
    ".document-row",
    ".task-row",
    ".chart-wrap"
  ];

  for (const selector of requiredSelectors) {
    assert.ok(stylesSource.includes(selector), `missing selector: ${selector}`);
  }

  assert.match(stylesSource, /overflow-x:\s*hidden/);
  assert.match(stylesSource, /grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*280px\),\s*1fr\)\)/);
  assert.match(stylesSource, /\.evidence-row\s*\{[\s\S]*?display:\s*grid/);
  assert.match(stylesSource, /\.blocker-row > \[data-slot="badge"\][\s\S]*?grid-column:\s*2/);
  assert.match(stylesSource, /\.document-row\s*\{[\s\S]*?grid-template-areas:/);
  assert.match(stylesSource, /\.task-row\s*\{[\s\S]*?grid-template-areas:/);
  assert.match(stylesSource, /\.chart-wrap\s*\{[\s\S]*?overflow:\s*hidden/);
  assert.doesNotMatch(stylesSource, /grid-template-columns:\s*minmax\(0,\s*1\.18fr\)\s+minmax\(0,\s*0\.92fr\)\s+minmax\(0,\s*1fr\)/);
  assert.doesNotMatch(stylesSource, /dashboard-grid\s*>\s*\[data-slot="card"\]:nth-child/);
});

test("Convex scaffold mirrors the Founder Studio workflow without frontend generated imports", () => {
  const requiredTables = ["businessStages", "readinessBlockers", "evidenceItems", "studioActivity", "exportCheckpoints"];
  const requiredFunctions = ["getFounderStudio", "updateStageReadiness", "resolveReadinessBlocker"];

  for (const table of requiredTables) {
    assert.ok(schemaSource.includes(`${table}: defineTable`), `missing Convex table: ${table}`);
  }

  for (const fn of requiredFunctions) {
    assert.ok(convexFunctionsSource.includes(`export const ${fn}`), `missing Convex function: ${fn}`);
  }

  assert.ok(!appSource.includes("convex/_generated"), "frontend should not import generated Convex API files");
});
