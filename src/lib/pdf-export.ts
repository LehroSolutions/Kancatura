import { jsPDF } from "jspdf";

import type {
  PlanSection,
  BusinessStage,
  ReadinessBlocker,
  EvidenceItem,
  ExportCheckpoint,
  FinancialMetric,
  RevenueQuarter,
  PlanTask,
  PlanDocument,
  WorkspaceNote
} from "@/data/kancatura";

// ── Types ──────────────────────────────────────────────────────────

interface PlanSummaryData {
  brand: string;
  brandSuffix: string;
  title: string;
  subtitle: string;
  completion: number;
  financialReadiness: number;
  evidenceCoverage: number;
  exportReadiness: number;
  lastSaved: string;
  profileName: string;
  profileRole: string;
  market: string;
  currentStageId: string;
}

export interface PdfExportData {
  planSummary: PlanSummaryData;
  sections: PlanSection[];
  stages: BusinessStage[];
  blockers: (ReadinessBlocker & { resolved: boolean })[];
  evidence: EvidenceItem[];
  checkpoints: ExportCheckpoint[];
  metrics: FinancialMetric[];
  revenue: RevenueQuarter[];
  tasks: PlanTask[];
  documents: PlanDocument[];
  notes: WorkspaceNote[];
}

// ── Design tokens ──────────────────────────────────────────────────

const PAGE_W = 210; // A4 mm
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = PAGE_H - 12;

const COLORS = {
  brand: [30, 58, 138] as const,       // deep blue
  brandLight: [59, 130, 246] as const,  // lighter blue
  dark: [15, 23, 42] as const,          // near-black
  body: [30, 41, 59] as const,          // body text
  muted: [100, 116, 139] as const,      // muted text
  light: [148, 163, 184] as const,      // light text
  white: [255, 255, 255] as const,
  bg: [248, 250, 252] as const,         // light bg
  border: [226, 232, 240] as const,     // border
  green: [22, 163, 74] as const,
  amber: [217, 119, 6] as const,
  red: [220, 38, 38] as const,
  violet: [124, 58, 237] as const,
};

// ── Helper class ───────────────────────────────────────────────────

class PdfBuilder {
  private doc: jsPDF;
  private y: number;
  private pageNum: number;

  constructor() {
    this.doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    this.y = MARGIN;
    this.pageNum = 0;
  }

  // ── Page management ────────────────────────────────────────────

  private newPage(): void {
    if (this.pageNum > 0) {
      this.drawFooter();
    }
    this.doc.addPage();
    this.pageNum++;
    this.y = MARGIN;
  }

  private firstPage(): void {
    this.pageNum = 1;
    this.y = MARGIN;
  }

  private drawFooter(): void {
    this.doc.setFontSize(8);
    this.doc.setTextColor(...COLORS.light);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(
      `KANCATURA Business Plan`,
      MARGIN,
      FOOTER_Y
    );
    this.doc.text(
      `Page ${this.pageNum}`,
      PAGE_W - MARGIN,
      FOOTER_Y,
      { align: "right" }
    );
  }

  private ensureSpace(needed: number): void {
    if (this.y + needed > PAGE_H - MARGIN - 8) {
      this.newPage();
    }
  }

  // ── Drawing primitives ─────────────────────────────────────────

  private hLine(y: number, color: readonly [number, number, number] = COLORS.border): void {
    this.doc.setDrawColor(...color);
    this.doc.setLineWidth(0.3);
    this.doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  }

  private thickLine(y: number, color: readonly [number, number, number] = COLORS.brand): void {
    this.doc.setDrawColor(...color);
    this.doc.setLineWidth(0.8);
    this.doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  }

  private filledRect(
    x: number, y: number, w: number, h: number,
    fill: readonly [number, number, number]
  ): void {
    this.doc.setFillColor(...fill);
    this.doc.rect(x, y, w, h, "F");
  }

  private roundedRect(
    x: number, y: number, w: number, h: number,
    fill: readonly [number, number, number],
    radius = 2
  ): void {
    this.doc.setFillColor(...fill);
    this.doc.roundedRect(x, y, w, h, radius, radius, "F");
  }

  // ── Text helpers ───────────────────────────────────────────────

  private heading(text: string, size: number, color: readonly [number, number, number] = COLORS.dark): void {
    this.doc.setFontSize(size);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...color);
    this.doc.text(text, MARGIN, this.y);
    this.y += size * 0.5;
  }

  private subheading(text: string, size = 12): void {
    this.doc.setFontSize(size);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...COLORS.body);
    this.doc.text(text, MARGIN, this.y);
    this.y += size * 0.45;
  }

  private bodyText(text: string, indent = 0): void {
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(...COLORS.body);
    const lines = this.doc.splitTextToSize(text, CONTENT_W - indent);
    for (const line of lines) {
      this.ensureSpace(5);
      this.doc.text(line, MARGIN + indent, this.y);
      this.y += 4.5;
    }
  }

  private mutedText(text: string, indent = 0): void {
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(...COLORS.muted);
    const lines = this.doc.splitTextToSize(text, CONTENT_W - indent);
    for (const line of lines) {
      this.ensureSpace(4.5);
      this.doc.text(line, MARGIN + indent, this.y);
      this.y += 4;
    }
  }

  private keyValue(key: string, value: string, indent = 0): void {
    this.ensureSpace(5);
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...COLORS.body);
    this.doc.text(`${key}:`, MARGIN + indent, this.y);

    const keyWidth = this.doc.getTextWidth(`${key}: `);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(...COLORS.muted);
    this.doc.text(value, MARGIN + indent + keyWidth + 1, this.y);
    this.y += 5;
  }

  private statusBadge(
    x: number, y: number, label: string,
    color: readonly [number, number, number]
  ): void {
    const w = this.doc.getTextWidth(label) + 6;
    this.roundedRect(x, y - 3.2, w, 4.5, color, 1);
    this.doc.setFontSize(7.5);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...COLORS.white);
    this.doc.text(label, x + 3, y);
  }

  private sectionDivider(): void {
    this.y += 3;
    this.hLine(this.y);
    this.y += 6;
  }

  // ── Pages ──────────────────────────────────────────────────────

  buildCoverPage(data: PdfExportData): void {
    this.firstPage();
    const { planSummary: s } = data;
    const dateStr = new Date().toLocaleDateString("en-ZA", {
      year: "numeric", month: "long", day: "numeric"
    });

    // Brand banner
    this.filledRect(0, 0, PAGE_W, 80, COLORS.brand);
    this.doc.setFontSize(32);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...COLORS.white);
    this.doc.text(s.brand, PAGE_W / 2, 35, { align: "center" });

    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(180, 200, 255);
    this.doc.text(s.brandSuffix, PAGE_W / 2, 48, { align: "center" });

    this.doc.setFontSize(9);
    this.doc.setTextColor(160, 185, 255);
    this.doc.text(dateStr, PAGE_W / 2, 62, { align: "center" });

    // Title block
    this.y = 100;
    this.heading(s.title, 22, COLORS.brand);
    this.y += 4;
    this.bodyText(s.subtitle);
    this.y += 10;
    this.thickLine(this.y, COLORS.brandLight);
    this.y += 10;

    // Profile info card
    this.roundedRect(MARGIN, this.y, CONTENT_W, 42, COLORS.bg, 3);
    const cardX = MARGIN + 10;
    let cardY = this.y + 10;

    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...COLORS.body);
    this.doc.text("Prepared by", cardX, cardY);
    cardY += 6;
    this.doc.setFontSize(14);
    this.doc.text(s.profileName, cardX, cardY);
    cardY += 8;

    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(...COLORS.muted);
    this.doc.text(s.profileRole, cardX, cardY);
    cardY += 6;
    this.doc.text(`Market: ${s.market}`, cardX, cardY);

    this.y += 54;

    // Readiness summary bar
    this.subheading("Plan Readiness Summary", 11);
    this.y += 2;

    const readinessItems = [
      { label: "Plan Completion", value: s.completion, color: COLORS.green },
      { label: "Financial Readiness", value: s.financialReadiness, color: COLORS.amber },
      { label: "Evidence Coverage", value: s.evidenceCoverage, color: COLORS.brandLight },
      { label: "Export Readiness", value: s.exportReadiness, color: COLORS.violet },
    ];

    const barW = CONTENT_W / 2 - 5;
    const barH = 14;
    for (let i = 0; i < readinessItems.length; i++) {
      const item = readinessItems[i];
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = MARGIN + col * (barW + 10);
      const by = this.y + row * (barH + 6);

      this.roundedRect(bx, by, barW, barH, COLORS.bg, 2);
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(...COLORS.body);
      this.doc.text(item.label, bx + 4, by + 5);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...COLORS.muted);
      this.doc.text(`${item.value}%`, bx + barW - 4, by + 5, { align: "right" });

      // Progress bar
      const progressW = Math.max(2, (barW - 8) * (item.value / 100));
      this.roundedRect(bx + 4, by + 8, barW - 8, 3, COLORS.border, 1);
      if (item.value > 0) {
        this.roundedRect(bx + 4, by + 8, progressW, 3, item.color, 1);
      }
    }

    this.y += 2 * (barH + 6) + 10;

    // Confidentiality note
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "italic");
    this.doc.setTextColor(...COLORS.light);
    this.doc.text(
      "This document is confidential and intended for the use of the intended recipient(s) only.",
      PAGE_W / 2,
      PAGE_H - 30,
      { align: "center" }
    );
    this.doc.text(
      `Generated by Kancatura on ${dateStr}`,
      PAGE_W / 2,
      PAGE_H - 24,
      { align: "center" }
    );

    this.drawFooter();
  }

  buildTableOfContents(data: PdfExportData): void {
    this.newPage();
    this.heading("Table of Contents", 18, COLORS.brand);
    this.y += 4;
    this.thickLine(this.y, COLORS.brand);
    this.y += 10;

    const tocEntries: { num: string; title: string; desc: string }[] = [];

    // Map sections to TOC entries
    const sectionOrder = [
      "executive-summary",
      "company-overview",
      "business-description",
      "market-analysis",
      "operating-plan",
      "marketing-sales",
      "financial-plan"
    ];

    for (let i = 0; i < sectionOrder.length; i++) {
      const section = data.sections.find((s) => s.id === sectionOrder[i]);
      if (section) {
        tocEntries.push({
          num: String(i + 1),
          title: section.title,
          desc: section.description
        });
      }
    }

    // Add appendix
    tocEntries.push({
      num: "A",
      title: "Appendix",
      desc: "Supporting evidence, documents, tasks, and review checkpoints"
    });

    for (const entry of tocEntries) {
      this.ensureSpace(14);

      // Number circle
      this.filledRect(MARGIN, this.y - 3.5, 8, 8, COLORS.brand);
      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(...COLORS.white);
      this.doc.text(entry.num, MARGIN + 4, this.y + 1.5, { align: "center" });

      // Title and description
      this.doc.setFontSize(11);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(...COLORS.dark);
      this.doc.text(entry.title, MARGIN + 14, this.y);
      this.y += 5;

      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...COLORS.muted);
      const descLines = this.doc.splitTextToSize(entry.desc, CONTENT_W - 14);
      this.doc.text(descLines[0] ?? "", MARGIN + 14, this.y);
      this.y += 8;
    }
  }

  buildSectionPage(section: PlanSection, stage: BusinessStage | undefined, index: number): void {
    this.newPage();

    // Section number + title header
    this.roundedRect(MARGIN, this.y - 4, CONTENT_W, 14, COLORS.bg, 2);
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(...COLORS.brand);
    this.doc.text(`SECTION ${index + 1}`, MARGIN + 6, this.y + 2);

    // Status badge
    const statusColors: Record<string, readonly [number, number, number]> = {
      complete: COLORS.green,
      review: COLORS.amber,
      draft: COLORS.light
    };
    this.statusBadge(
      PAGE_W - MARGIN - 24,
      this.y + 2,
      section.status.toUpperCase(),
      statusColors[section.status] ?? COLORS.light
    );

    this.y += 16;
    this.heading(section.title, 18, COLORS.dark);
    this.y += 2;

    // Stage association
    if (stage) {
      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...COLORS.brandLight);
      this.doc.text(`Phase ${stage.phase}: ${stage.title}`, MARGIN, this.y);
      this.y += 6;
    }

    this.thickLine(this.y, COLORS.brand);
    this.y += 8;

    // Description
    this.bodyText(section.description);
    this.y += 4;

    // Details grid
    this.sectionDivider();
    this.subheading("Section Details", 11);
    this.y += 2;

    this.keyValue("Owner", section.owner, 0);
    this.keyValue("Completion", `${section.completion}%`, 0);
    this.keyValue("Risk Level", section.risk, 0);
    this.keyValue("Evidence", section.evidence, 0);
    this.keyValue("Last Updated", section.updatedAt, 0);
    this.y += 4;

    // Next action
    if (section.nextAction) {
      this.sectionDivider();
      this.subheading("Next Action", 11);
      this.y += 2;
      this.roundedRect(MARGIN, this.y, CONTENT_W, 12, COLORS.bg, 2);
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(...COLORS.body);
      const actionLines = this.doc.splitTextToSize(section.nextAction, CONTENT_W - 12);
      this.doc.text(actionLines[0] ?? "", MARGIN + 6, this.y + 7);
      this.y += 16;
    }

    // Notes
    if (section.notes.length > 0) {
      this.sectionDivider();
      this.subheading("Notes & Guidance", 11);
      this.y += 2;
      for (const note of section.notes) {
        this.ensureSpace(8);
        this.doc.setFontSize(9);
        this.doc.setTextColor(...COLORS.brandLight);
        this.doc.setFillColor(...COLORS.body);
        this.doc.circle(MARGIN + 3, this.y - 1, 0.5, "F");
        this.doc.setTextColor(...COLORS.body);
        const noteLines = this.doc.splitTextToSize(note, CONTENT_W - 10);
        this.doc.text(noteLines, MARGIN + 8, this.y);
        this.y += noteLines.length * 4 + 3;
      }
    }
  }

  buildFinancialSection(data: PdfExportData): void {
    // Only add extra financial content if there are metrics or revenue
    if (data.metrics.length === 0 && data.revenue.length === 0) return;

    this.ensureSpace(40);
    this.sectionDivider();
    this.subheading("Financial Metrics", 12);
    this.y += 4;

    if (data.metrics.length > 0) {
      const colW = CONTENT_W / Math.min(data.metrics.length, 3);
      for (let i = 0; i < data.metrics.length; i++) {
        const m = data.metrics[i];
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cx = MARGIN + col * colW;
        const cy = this.y + row * 22;

        this.ensureSpace(22);
        this.roundedRect(cx, cy, colW - 4, 18, COLORS.bg, 2);
        this.doc.setFontSize(8);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(...COLORS.muted);
        this.doc.text(m.label, cx + 4, cy + 5);

        this.doc.setFontSize(14);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(...COLORS.dark);
        this.doc.text(m.value, cx + 4, cy + 12);

        this.doc.setFontSize(7);
        this.doc.setTextColor(...COLORS.muted);
        this.doc.text(m.status, cx + 4, cy + 16);
      }
      this.y += Math.ceil(data.metrics.length / 3) * 22 + 6;
    }

    if (data.revenue.length > 0) {
      this.ensureSpace(30);
      this.subheading("Revenue Projections", 11);
      this.y += 4;

      // Table header
      const tableX = MARGIN;
      const colWidths = [35, 35, 35, 35, 30];
      const headers = ["Quarter", "Year 1", "Year 2", "Year 3", "Margin"];

      this.filledRect(tableX, this.y - 3.5, CONTENT_W, 8, COLORS.brand);
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "bold");
      this.doc.setTextColor(...COLORS.white);
      let hx = tableX + 3;
      for (let i = 0; i < headers.length; i++) {
        this.doc.text(headers[i], hx, this.y);
        hx += colWidths[i];
      }
      this.y += 8;

      // Table rows
      for (const row of data.revenue) {
        this.ensureSpace(7);
        this.doc.setFontSize(9);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(...COLORS.body);

        let rx = tableX + 3;
        const vals = [
          row.quarter,
          `R${row.yearOne.toLocaleString()}`,
          `R${row.yearTwo.toLocaleString()}`,
          `R${row.yearThree.toLocaleString()}`,
          `${row.margin}%`
        ];
        for (let i = 0; i < vals.length; i++) {
          this.doc.text(vals[i], rx, this.y);
          rx += colWidths[i];
        }
        this.y += 6;
        this.hLine(this.y - 2);
      }
    }
  }

  buildAppendix(data: PdfExportData): void {
    this.newPage();
    this.heading("Appendix", 18, COLORS.brand);
    this.y += 2;
    this.thickLine(this.y, COLORS.brand);
    this.y += 10;

    // A. Evidence Register
    this.subheading("A. Evidence Register", 12);
    this.y += 4;

    if (data.evidence.length > 0) {
      for (const item of data.evidence) {
        this.ensureSpace(16);
        this.roundedRect(MARGIN, this.y, CONTENT_W, 13, COLORS.bg, 2);

        const statusColors: Record<string, readonly [number, number, number]> = {
          verified: COLORS.green,
          review: COLORS.amber,
          draft: COLORS.light,
          needed: COLORS.red
        };

        this.doc.setFontSize(10);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(...COLORS.dark);
        this.doc.text(item.title, MARGIN + 4, this.y + 5);

        this.statusBadge(
          PAGE_W - MARGIN - 24,
          this.y + 5,
          item.status.toUpperCase(),
          statusColors[item.status] ?? COLORS.light
        );

        this.doc.setFontSize(8);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(...COLORS.muted);
        this.doc.text(`${item.source} - ${item.detail}`, MARGIN + 4, this.y + 10);
        this.y += 16;
      }
    } else {
      this.mutedText("No evidence items recorded yet.");
      this.y += 4;
    }

    // B. Readiness Blockers
    this.y += 4;
    this.subheading("B. Readiness Blockers", 12);
    this.y += 4;

    const activeBlockers = data.blockers.filter((b) => !b.resolved);
    if (activeBlockers.length > 0) {
      for (const blocker of activeBlockers) {
        this.ensureSpace(16);
        this.roundedRect(MARGIN, this.y, CONTENT_W, 13, COLORS.bg, 2);

        const sevColors: Record<string, readonly [number, number, number]> = {
          High: COLORS.red,
          Medium: COLORS.amber,
          Low: COLORS.green
        };

        this.doc.setFontSize(10);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(...COLORS.dark);
        this.doc.text(blocker.label, MARGIN + 4, this.y + 5);

        this.statusBadge(
          PAGE_W - MARGIN - 22,
          this.y + 5,
          blocker.severity.toUpperCase(),
          sevColors[blocker.severity] ?? COLORS.light
        );

        this.doc.setFontSize(8);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(...COLORS.muted);
        this.doc.text(`${blocker.owner} - ${blocker.action}`, MARGIN + 4, this.y + 10);
        this.y += 16;
      }
    } else {
      this.mutedText("No active blockers.");
      this.y += 4;
    }

    // C. Export Checkpoints
    this.y += 4;
    this.subheading("C. Export Checkpoints", 12);
    this.y += 4;

    if (data.checkpoints.length > 0) {
      for (const cp of data.checkpoints) {
        this.ensureSpace(10);
        const cpColors: Record<string, readonly [number, number, number]> = {
          ready: COLORS.green,
          review: COLORS.amber,
          blocked: COLORS.red
        };
        this.filledRect(MARGIN, this.y - 2.5, 3, 3, cpColors[cp.status] ?? COLORS.light);
        this.doc.setFontSize(10);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(...COLORS.dark);
        this.doc.text(cp.label, MARGIN + 7, this.y);
        this.y += 4;
        this.mutedText(cp.detail, 7);
        this.y += 2;
      }
    } else {
      this.mutedText("No export checkpoints.");
      this.y += 4;
    }

    // D. Tasks
    if (data.tasks.length > 0) {
      this.y += 6;
      this.subheading("D. Task List", 12);
      this.y += 4;

      for (const task of data.tasks) {
        this.ensureSpace(8);
        this.doc.setFontSize(10);
        this.doc.setFont("helvetica", "normal");
        if (task.complete) {
          this.doc.setTextColor(...COLORS.light);
        } else {
          this.doc.setTextColor(...COLORS.body);
        }
        this.doc.setDrawColor(...COLORS.muted);
        this.doc.setLineWidth(0.25);
        this.doc.rect(MARGIN + 2, this.y - 2.7, 3, 3);
        if (task.complete) {
          this.doc.line(MARGIN + 2.5, this.y - 1.2, MARGIN + 3.2, this.y - 0.5);
          this.doc.line(MARGIN + 3.2, this.y - 0.5, MARGIN + 4.5, this.y - 2.2);
        }
        this.doc.text(task.label, MARGIN + 7, this.y);
        this.doc.setFontSize(8);
        this.doc.setTextColor(...COLORS.muted);
        this.doc.text(`${task.owner} - Due: ${task.due}`, MARGIN + 12, this.y + 4);
        this.y += 9;
      }
    }

    // E. Documents
    if (data.documents.length > 0) {
      this.y += 6;
      this.subheading("E. Document Library", 12);
      this.y += 4;

      for (const doc of data.documents) {
        this.ensureSpace(8);
        this.doc.setFontSize(10);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(...COLORS.dark);
        this.doc.text(doc.name, MARGIN + 2, this.y);

        this.statusBadge(
          PAGE_W - MARGIN - 18,
          this.y,
          doc.kind,
          COLORS.brandLight
        );

        this.doc.setFontSize(8);
        this.doc.setFont("helvetica", "normal");
        this.doc.setTextColor(...COLORS.muted);
        this.doc.text(`${doc.status} - Updated: ${doc.updatedAt}`, MARGIN + 2, this.y + 5);
        this.y += 10;
      }
    }

    // F. Workspace Notes
    if (data.notes.length > 0) {
      this.y += 6;
      this.subheading("F. Workspace Notes", 12);
      this.y += 4;

      for (const note of data.notes) {
        this.ensureSpace(14);
        this.doc.setFontSize(10);
        this.doc.setFont("helvetica", "bold");
        this.doc.setTextColor(...COLORS.dark);
        this.doc.text(note.title, MARGIN + 2, this.y);
        this.y += 5;
        this.mutedText(note.body, 2);
        this.doc.setFontSize(7);
        this.doc.setTextColor(...COLORS.light);
        this.doc.text(note.updatedAt, MARGIN + 2, this.y);
        this.y += 6;
      }
    }
  }

  // ── Main build orchestrator ────────────────────────────────────

  build(data: PdfExportData): jsPDF {
    // 1. Cover page
    this.buildCoverPage(data);

    // 2. Table of contents
    this.buildTableOfContents(data);

    // 3. Business plan sections
    const sectionOrder = [
      "executive-summary",
      "company-overview",
      "business-description",
      "market-analysis",
      "operating-plan",
      "marketing-sales",
      "financial-plan"
    ];

    for (let i = 0; i < sectionOrder.length; i++) {
      const section = data.sections.find((s) => s.id === sectionOrder[i]);
      if (section) {
        const stage = data.stages.find((st) => st.id === section.stageId);
        this.buildSectionPage(section, stage, i);

        // Add financial extras after the financial plan section
        if (section.id === "financial-plan") {
          this.buildFinancialSection(data);
        }
      }
    }

    // 4. Appendix
    this.buildAppendix(data);

    // Final footer on last page
    this.drawFooter();

    return this.doc;
  }
}

// ── Public API ───────────────────────────────────────────────────────

export async function generateBusinessPlanPdf(data: PdfExportData): Promise<Blob> {
  const builder = new PdfBuilder();
  const doc = builder.build(data);
  const blob = doc.output("blob");
  return blob;
}

export async function downloadBusinessPlanPdf(data: PdfExportData, filename?: string): Promise<void> {
  const blob = await generateBusinessPlanPdf(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `Kancatura-Business-Plan-${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
