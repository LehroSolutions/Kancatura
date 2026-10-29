import type { PlanSection, StudioSignal } from "../data/kancatura";

export type PlanSummarySignals = {
  completion: number;
  financialReadiness: number;
  evidenceCoverage: number;
  exportReadiness: number;
};

export function computeStudioSignals(
  sections: readonly PlanSection[],
  plan: PlanSummarySignals,
  evidenceCount: number,
  neededEvidenceCount: number
): StudioSignal[] {
  const readyCount = sections.filter((section) => section.status === "complete").length;
  const startedCount = sections.filter((section) => section.completion > 0).length;
  const remainingCount = Math.max(0, sections.length - readyCount);

  return [
    { label: "Plan completion", value: `${plan.completion}%`, detail: `${readyCount} of ${sections.length} sections complete`, tone: "green" },
    { label: "Financial readiness", value: `${plan.financialReadiness}%`, detail: startedCount > 0 ? `${startedCount} sections in progress` : "start your financial plan", tone: "amber" },
    { label: "Evidence coverage", value: `${plan.evidenceCoverage}%`, detail: neededEvidenceCount > 0 ? `${neededEvidenceCount} items needed` : `${evidenceCount} items collected`, tone: "blue" },
    { label: "Export readiness", value: `${plan.exportReadiness}%`, detail: remainingCount === 0 ? "ready to export" : `${remainingCount} sections remaining`, tone: "violet" }
  ];
}