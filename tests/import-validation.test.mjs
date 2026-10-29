import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_RECORDS_PER_STORE,
  parseWorkspaceImport,
  sanitizeStoreRecords,
  WORKSPACE_STORES
} from "../src/lib/import-validation.ts";

function planRecord(overrides = {}) {
  return {
    id: "default",
    brand: "Kancatura",
    brandSuffix: "",
    title: "Business Plan",
    subtitle: "",
    completion: 40,
    financialReadiness: 30,
    evidenceCoverage: 20,
    exportReadiness: 10,
    lastSaved: "Jan 1, 2026",
    profileName: "",
    profileRole: "",
    market: "",
    currentStageId: "foundation",
    ...overrides
  };
}

test("a well-formed export round-trips through validation", () => {
  const { records, storeCount } = parseWorkspaceImport(JSON.stringify({
    plan: [planRecord()],
    planTasks: [{ id: "task-1", stageId: "foundation", label: "Write plan", due: "TBD", complete: false, owner: "Ada", _updatedAt: 5 }]
  }));

  assert.equal(storeCount, 2);
  assert.equal(records.plan.length, 1);
  assert.equal(records.plan[0].title, "Business Plan");
  assert.equal(records.planTasks[0].label, "Write plan");
});

test("the export allowlist and the object-store list stay in sync", () => {
  assert.equal(WORKSPACE_STORES.length, 13);
  assert.equal(new Set(WORKSPACE_STORES).size, WORKSPACE_STORES.length);
});

test("out-of-range percentages are clamped instead of stored", () => {
  const [record] = sanitizeStoreRecords("plan", [planRecord({ completion: 4800, financialReadiness: -30 })]);

  assert.equal(record.completion, 100);
  assert.equal(record.financialReadiness, 0);
});

test("NaN and Infinity are rejected rather than coerced", () => {
  assert.throws(
    () => sanitizeStoreRecords("plan", [planRecord({ evidenceCoverage: Number.NaN })]),
    /"evidenceCoverage" must be a finite number/
  );
  assert.throws(
    () => sanitizeStoreRecords("revenueProjection", [{ quarter: "Q1", yearOne: Number.POSITIVE_INFINITY }]),
    /"yearOne" must be a finite number/
  );
});

test("an absent optional field falls back to a safe default", () => {
  const [record] = sanitizeStoreRecords("planSections", [{ id: "s1", stageId: "foundation", status: "draft", risk: "Low" }]);

  assert.equal(record.completion, 0);
  assert.deepEqual(record.notes, []);
  assert.equal(record.nextAction, "");
});

test("a required enum cannot be defaulted away", () => {
  assert.throws(
    () => sanitizeStoreRecords("planSections", [{ id: "s1", stageId: "foundation" }]),
    /"status" is required/
  );
});

test("non-numeric percentages are rejected rather than coerced to zero", () => {
  assert.throws(
    () => sanitizeStoreRecords("plan", [planRecord({ completion: "99%" })]),
    /"completion" must be a finite number/
  );
});

test("unknown keys from a crafted export are dropped", () => {
  const [record] = sanitizeStoreRecords("plan", [{ ...planRecord(), __proto__polluted: true, isAdmin: true, role: "root" }]);

  assert.equal("isAdmin" in record, false);
  assert.equal("role" in record, false);
});

test("over-long strings are truncated and long lists are capped", () => {
  const [record] = sanitizeStoreRecords("planTasks", [{
    id: "task-1",
    stageId: "foundation",
    label: "x".repeat(9000),
    due: "d".repeat(400),
    complete: false,
    owner: "o".repeat(400)
  }]);

  assert.equal(record.label.length, 4000);
  assert.equal(record.due.length, 120);
  assert.equal(record.owner.length, 120);
});

test("list fields drop non-string entries and cap their length", () => {
  const [record] = sanitizeStoreRecords("planSections", [{
    id: "section-1",
    stageId: "foundation",
    notes: [...Array(80).fill("note"), 42, null, { evil: true }],
    completion: 10,
    status: "draft",
    risk: "Low"
  }]);

  assert.equal(record.notes.length, 50);
  assert.deepEqual(record.notes.at(-1), "note");
});

test("trend series drop non-finite points and keep the most recent window", () => {
  const [record] = sanitizeStoreRecords("financialMetrics", [{
    label: "Revenue",
    value: "R2.8M",
    status: "+12%",
    delta: "up",
    tone: "green",
    trend: [Number.NaN, ...Array(60).fill(1), Number.POSITIVE_INFINITY, 7]
  }]);

  assert.equal(record.trend.length, 36);
  assert.equal(record.trend.at(-1), 7);
});

test("records without a usable IndexedDB key are rejected", () => {
  assert.throws(() => sanitizeStoreRecords("workspaceNotes", [{ body: "orphan" }]), /"title" is required/);
  assert.throws(() => sanitizeStoreRecords("planTasks", [{ id: 42 }]), /"id" must be text/);
  assert.throws(() => sanitizeStoreRecords("planSections", ["not-an-object"]), /expected an object/);
});

test("out-of-vocabulary enum values are rejected", () => {
  assert.throws(
    () => sanitizeStoreRecords("planSections", [{ id: "s1", stageId: "foundation", status: "archived" }]),
    /"status" must be one of complete, review, draft/
  );
  assert.throws(
    () => sanitizeStoreRecords("planDocuments", [{ id: "d1", stageId: "foundation", kind: "EXE" }]),
    /"kind" must be one of DOCX, XLSX, PDF, PPTX/
  );
});

test("currency values are clamped to a sane ceiling", () => {
  const [record] = sanitizeStoreRecords("revenueProjection", [{
    quarter: "Q1",
    yearOne: 1e30,
    yearTwo: -5,
    yearThree: 2500000,
    margin: 18
  }]);

  assert.equal(record.yearOne, 1_000_000_000_000);
  assert.equal(record.yearTwo, 0);
  assert.equal(record.yearThree, 2500000);
});

test("a crafted export cannot introduce a second plan record", () => {
  const { records } = parseWorkspaceImport(JSON.stringify({ plan: [planRecord({ id: "victim-tenant" })] }));

  assert.equal(records.plan[0].id, "default");
});

test("structural import failures are still reported to the user", () => {
  assert.throws(() => parseWorkspaceImport("{nope"), /Invalid JSON format/);
  assert.throws(() => parseWorkspaceImport("[]"), /Expected a workspace export file/);
  assert.throws(() => parseWorkspaceImport(JSON.stringify({ unknownStore: [] })), /No valid workspace data found/);
  assert.throws(
    () => parseWorkspaceImport(JSON.stringify({ plan: [planRecord(), ...Array(MAX_RECORDS_PER_STORE).fill(planRecord())] })),
    /Too many records in "plan"/
  );
});

test("unknown stores in an export are ignored rather than rejected", () => {
  const { records, storeCount } = parseWorkspaceImport(JSON.stringify({
    plan: [planRecord()],
    __proto__: [planRecord()],
    anotherStore: [{ anything: true }]
  }));

  assert.equal(storeCount, 1);
  assert.deepEqual(Object.keys(records), ["plan"]);
});