import assert from "node:assert/strict";
import test from "node:test";

import {
  MARGIN_AXIS_MAX_PERCENT,
  MAX_CHART_POINTS,
  boundedList,
  clamp,
  finiteSeries,
  marginToChartY,
  maxOf,
  minOf
} from "../src/lib/chart-metrics.ts";

test("boundedList caps an oversized series instead of throwing", () => {
  const huge = Array.from({ length: 250_000 }, (_, index) => index);
  const bounded = boundedList(huge);

  assert.equal(bounded.length, MAX_CHART_POINTS);
  assert.equal(bounded.at(-1), 249_999);
});

test("boundedList leaves an in-range series untouched", () => {
  assert.deepEqual(boundedList([1, 2, 3]), [1, 2, 3]);
  assert.deepEqual(boundedList([]), []);
});

test("reductions survive arrays far past the engine argument limit", () => {
  const huge = Array.from({ length: 500_000 }, (_, index) => index);

  assert.equal(maxOf(huge, 0), 499_999);
  assert.equal(minOf(huge, 0), 0);
});

test("reductions ignore non-finite values and fall back when empty", () => {
  assert.equal(maxOf([Number.NaN, 4, Number.POSITIVE_INFINITY], 0), 4);
  assert.equal(minOf([Number.NaN, -2], 0), -2);
  assert.equal(maxOf([], 7), 7);
  assert.equal(minOf([], 7), 7);
  assert.equal(maxOf([Number.NaN], 3), 3);
});

test("finiteSeries drops non-finite points and keeps the most recent window", () => {
  const series = finiteSeries([1, Number.NaN, 2, 3, Number.POSITIVE_INFINITY, 4]);

  assert.deepEqual(series, [1, 2, 3, 4]);
  assert.equal(finiteSeries([]).length, 0);
  assert.equal(finiteSeries(Array.from({ length: 200 }, (_, i) => i)).length, MAX_CHART_POINTS);
});

test("clamp keeps values inside its bounds and floors non-finite input", () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(50, 0, 10), 10);
  assert.equal(clamp(Number.NaN, 2, 10), 2);
});

test("EBITDA margin is treated as a percentage, matching the PDF export", () => {
  // 0% sits on the baseline and the axis maximum sits on the top gridline.
  assert.equal(marginToChartY(0), 216);
  assert.equal(marginToChartY(MARGIN_AXIS_MAX_PERCENT), 48);

  const tenPercent = marginToChartY(10);
  assert.ok(tenPercent < marginToChartY(0) && tenPercent > marginToChartY(MARGIN_AXIS_MAX_PERCENT));
  assert.ok(Math.abs(tenPercent - 132) < 0.001);
});

test("margin geometry stays finite for hostile values", () => {
  for (const value of [Number.NaN, Number.POSITIVE_INFINITY, -1e9, 1e9]) {
    assert.ok(Number.isFinite(marginToChartY(value)), `not finite for ${value}`);
  }
  assert.equal(marginToChartY(1e9), 48);
  assert.equal(marginToChartY(-1e9), 216);
});