// Pure chart maths. Reductions are iterative on purpose: spreading an imported
// array into Math.min/Math.max throws RangeError once it exceeds the engine's
// argument limit, and these series come straight from user-controlled storage.

export const MAX_CHART_POINTS = 24;

export function boundedList<T>(values: readonly T[], limit: number = MAX_CHART_POINTS): T[] {
  return values.length > limit ? values.slice(-limit) : values.slice();
}

export function finiteSeries(values: readonly number[], limit: number = MAX_CHART_POINTS): number[] {
  const finite = values.filter((value) => Number.isFinite(value));
  return finite.length > limit ? finite.slice(-limit) : finite;
}

export function maxOf(values: readonly number[], fallback: number): number {
  let max = -Infinity;
  for (const value of values) {
    if (Number.isFinite(value) && value > max) max = value;
  }
  return max === -Infinity ? fallback : max;
}

export function minOf(values: readonly number[], fallback: number): number {
  let min = Infinity;
  for (const value of values) {
    if (Number.isFinite(value) && value < min) min = value;
  }
  return min === Infinity ? fallback : min;
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

// EBITDA margin is stored and printed as a percentage (18 means 18%), matching
// the PDF export and the chart's right-hand axis labels.
export const MARGIN_AXIS_MAX_PERCENT = 20;

const MARGIN_PLOT_BOTTOM = 216;
const MARGIN_PLOT_HEIGHT = 168;

export function marginToChartY(margin: number): number {
  const percent = clamp(margin, 0, MARGIN_AXIS_MAX_PERCENT);
  return MARGIN_PLOT_BOTTOM - (percent / MARGIN_AXIS_MAX_PERCENT) * MARGIN_PLOT_HEIGHT;
}