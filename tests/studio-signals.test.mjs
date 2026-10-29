import assert from "node:assert/strict";
import test from "node:test";

import { computeStudioSignals } from "../src/lib/studio-signals.ts";

const plan = {
  completion: 45,
  financialReadiness: 30,
  evidenceCoverage: 20,
  exportReadiness: 10
};

function section(overrides = {}) {
  return {
    id: "section-1",
    stageId: "foundation",
    title: "Section",
    description: "",
    completion: 0,
    status: "draft",
    owner: "",
    updatedAt: "",
    evidence: "",
    risk: "Low",
    nextAction: "",
    notes: [],
    ...overrides
  };
}

test("readiness signals report section progress", () => {
  const signals = computeStudioSignals(
    [section(), section({ id: "s2", status: "complete" }), section({ id: "s3", completion: 60 })],
    plan,
    4,
    2
  );

  assert.deepEqual(signals.map((signal) => signal.label), [
    "Plan completion",
    "Financial readiness",
    "Evidence coverage",
    "Export readiness"
  ]);
  assert.equal(signals[0].value, "45%");
  assert.equal(signals[0].detail, "1 of 3 sections complete");
  assert.equal(signals[1].detail, "1 sections in progress");
  assert.equal(signals[2].detail, "2 items needed");
  assert.equal(signals[3].detail, "2 sections remaining");
});

test("a fully complete workspace reports export readiness", () => {
  const signals = computeStudioSignals(
    [section({ status: "complete" }), section({ id: "s2", status: "complete" })],
    plan,
    5,
    0
  );

  assert.equal(signals[2].detail, "5 items collected");
  assert.equal(signals[3].detail, "ready to export");
});

test("an empty workspace never reports negative remaining work", () => {
  const signals = computeStudioSignals([], plan, 0, 0);

  assert.equal(signals[0].detail, "0 of 0 sections complete");
  assert.equal(signals[1].detail, "start your financial plan");
  assert.equal(signals[2].detail, "0 items collected");
  assert.equal(signals[3].detail, "ready to export");
});