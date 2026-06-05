import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  CircleDollarSign,
  ClipboardCheck,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Headphones,
  Megaphone,
  Rocket,
  ShieldCheck,
  Target,
  UsersRound,
  WalletCards
} from "lucide-react";

export type SectionStatus = "complete" | "review" | "draft";
export type StageStatus = "complete" | "active" | "blocked" | "queued";
export type StudioTone = "green" | "blue" | "violet" | "orange" | "amber";

export type PlanSection = {
  id: string;
  stageId: BusinessStage["id"];
  title: string;
  description: string;
  completion: number;
  status: SectionStatus;
  owner: string;
  updatedAt: string;
  evidence: string;
  risk: "Low" | "Medium" | "High";
  nextAction: string;
  notes: string[];
};

export type BusinessStage = {
  id: string;
  phase: string;
  title: string;
  description: string;
  owner: string;
  readiness: number;
  status: StageStatus;
  tone: StudioTone;
  icon: LucideIcon;
  sectionId?: string;
  nextAction: string;
  blockers: string[];
  evidence: string[];
  linkedTaskIds: string[];
  linkedDocumentIds: string[];
};

export type ReadinessBlocker = {
  id: string;
  stageId: BusinessStage["id"];
  label: string;
  severity: "Low" | "Medium" | "High";
  owner: string;
  action: string;
};

export type EvidenceItem = {
  id: string;
  stageId: BusinessStage["id"];
  title: string;
  source: string;
  status: "verified" | "review" | "draft" | "needed";
  detail: string;
};

export type StudioActivity = {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  tone: StudioTone;
};

export type ExportCheckpoint = {
  id: string;
  label: string;
  status: "ready" | "review" | "blocked";
  detail: string;
  stageId?: BusinessStage["id"];
};

export type Highlight = {
  title: string;
  body: string;
  icon: LucideIcon;
  tone: Exclude<StudioTone, "amber">;
};

export type FinancialMetric = {
  label: string;
  value: string;
  status: string;
  delta: string;
  tone: StudioTone;
  trend: number[];
};

export type RevenueQuarter = {
  quarter: string;
  yearOne: number;
  yearTwo: number;
  yearThree: number;
  margin: number;
};

export type PlanTask = {
  id: string;
  stageId: BusinessStage["id"];
  label: string;
  due: string;
  complete: boolean;
  owner: string;
};

export type PlanDocument = {
  id: string;
  stageId: BusinessStage["id"];
  name: string;
  kind: "DOCX" | "XLSX" | "PDF" | "PPTX";
  updatedAt: string;
  status: string;
};

export type Capability = {
  title: string;
  body: string;
  icon: LucideIcon;
  tone: Highlight["tone"];
};

export type WorkspaceNote = {
  title: string;
  body: string;
  updatedAt: string;
};

export type StudioSignal = {
  label: string;
  value: string;
  detail: string;
  tone: StudioTone;
};

// ── Production seed data ─────────────────────────────────────────
// New workspaces start with structural scaffolding (stages, checkpoints,
// capability strip) and template prompts to guide the user. All user-
// generated content (sections, tasks, documents, financial data, notes,
// metrics, revenue) starts empty so the workspace reflects the user's
// actual business from day one.

export const planSummary = {
  brand: "KANCATURA",
  brandSuffix: "BUSINESS PLAN",
  title: "Founder Studio",
  subtitle: "Build the business, prove the assumptions, and prepare the plan without losing the thread.",
  completion: 0,
  financialReadiness: 0,
  evidenceCoverage: 0,
  exportReadiness: 0,
  lastSaved: "Not yet saved",
  profileName: "Kancatura Workspace",
  profileRole: "Founder",
  market: "Define your target market",
  currentStageId: "foundation"
};

export const planSections: PlanSection[] = [
  {
    id: "executive-summary",
    stageId: "export",
    title: "Executive Summary",
    description: "A crisp investor-ready overview of the mission, model, milestones, and capital logic.",
    completion: 0,
    status: "draft",
    owner: "Unassigned",
    updatedAt: "Not started",
    evidence: "None yet",
    risk: "Low",
    nextAction: "Write a compelling overview of your business mission, model, and key milestones.",
    notes: ["Start with your mission, business model, and first-year targets.", "Keep this section synced as you complete other sections."]
  },
  {
    id: "company-overview",
    stageId: "foundation",
    title: "Company Overview",
    description: "Company identity, ownership, operating context, legal readiness, and near-term milestones.",
    completion: 0,
    status: "draft",
    owner: "Unassigned",
    updatedAt: "Not started",
    evidence: "None yet",
    risk: "Low",
    nextAction: "Define your company identity, ownership structure, and legal setup.",
    notes: ["Include your company registration details and founder background.", "Set clear near-term milestones for your business."]
  },
  {
    id: "business-description",
    stageId: "foundation",
    title: "Business Description",
    description: "Service scope, customer pain, delivery approach, pricing posture, and operational promise.",
    completion: 0,
    status: "draft",
    owner: "Unassigned",
    updatedAt: "Not started",
    evidence: "None yet",
    risk: "Low",
    nextAction: "Describe your product or service, the customer problem you solve, and your delivery approach.",
    notes: ["Be specific about the customer pain points you address.", "Define your pricing and delivery model clearly."]
  },
  {
    id: "market-analysis",
    stageId: "market-proof",
    title: "Market Analysis",
    description: "Target segments, demand signals, competitor pressure, and buying behavior.",
    completion: 0,
    status: "draft",
    owner: "Unassigned",
    updatedAt: "Not started",
    evidence: "None yet",
    risk: "Medium",
    nextAction: "Identify your target market segments and validate demand with real data.",
    notes: ["Research your target segments and gather evidence of demand.", "Map your competitors and their pricing."]
  },
  {
    id: "operating-plan",
    stageId: "operations",
    title: "Operating Plan",
    description: "Delivery process, service capacity, support coverage, and first 90-day operating KPIs.",
    completion: 0,
    status: "draft",
    owner: "Unassigned",
    updatedAt: "Not started",
    evidence: "None yet",
    risk: "Medium",
    nextAction: "Define your delivery process, support workflow, and key operating KPIs.",
    notes: ["Outline your service delivery workflow step by step.", "Set measurable KPIs for your first 90 days."]
  },
  {
    id: "marketing-sales",
    stageId: "launch",
    title: "Marketing & Sales Plan",
    description: "Acquisition channels, referral motion, launch offers, sales cadence, and conversion assumptions.",
    completion: 0,
    status: "draft",
    owner: "Unassigned",
    updatedAt: "Not started",
    evidence: "None yet",
    risk: "Medium",
    nextAction: "Plan your acquisition channels, launch strategy, and sales process.",
    notes: ["Identify your primary marketing channels and estimated costs.", "Define your sales cadence and conversion targets."]
  },
  {
    id: "financial-plan",
    stageId: "finance",
    title: "Financial Plan",
    description: "Revenue forecast, gross margin, break-even timing, payroll assumptions, and funding requirements.",
    completion: 0,
    status: "draft",
    owner: "Unassigned",
    updatedAt: "Not started",
    evidence: "None yet",
    risk: "High",
    nextAction: "Build your revenue model, estimate costs, and calculate your break-even point.",
    notes: ["Start with revenue projections based on realistic assumptions.", "Detail your cost base: staffing, infrastructure, and support."]
  }
];

export const businessStages: BusinessStage[] = [
  {
    id: "foundation",
    phase: "01",
    title: "Foundation",
    description: "Lock the business identity, offer, operating promise, and legal footing.",
    owner: "Unassigned",
    readiness: 0,
    status: "active",
    tone: "green",
    icon: BriefcaseBusiness,
    sectionId: "company-overview",
    nextAction: "Define your company identity, ownership, and legal structure to get started.",
    blockers: [],
    evidence: [],
    linkedTaskIds: [],
    linkedDocumentIds: []
  },
  {
    id: "market-proof",
    phase: "02",
    title: "Market Proof",
    description: "Turn interviews, competitor pressure, and buying behavior into a defensible opportunity.",
    owner: "Unassigned",
    readiness: 0,
    status: "queued",
    tone: "blue",
    icon: UsersRound,
    sectionId: "market-analysis",
    nextAction: "Research your target market and gather evidence of demand.",
    blockers: [],
    evidence: [],
    linkedTaskIds: [],
    linkedDocumentIds: []
  },
  {
    id: "operations",
    phase: "03",
    title: "Operations",
    description: "Shape the delivery model, support cadence, service levels, and first 90-day controls.",
    owner: "Unassigned",
    readiness: 0,
    status: "queued",
    tone: "violet",
    icon: ClipboardCheck,
    sectionId: "operating-plan",
    nextAction: "Define your delivery model, support workflow, and operating KPIs.",
    blockers: [],
    evidence: [],
    linkedTaskIds: [],
    linkedDocumentIds: []
  },
  {
    id: "finance",
    phase: "04",
    title: "Finance",
    description: "Pressure-test revenue, support costs, break-even timing, and funding needs.",
    owner: "Unassigned",
    readiness: 0,
    status: "queued",
    tone: "amber",
    icon: WalletCards,
    sectionId: "financial-plan",
    nextAction: "Build your financial model with revenue projections and cost estimates.",
    blockers: [],
    evidence: [],
    linkedTaskIds: [],
    linkedDocumentIds: []
  },
  {
    id: "launch",
    phase: "05",
    title: "Launch",
    description: "Convert channels, referral loops, and pilot commitments into a practical go-to-market motion.",
    owner: "Unassigned",
    readiness: 0,
    status: "queued",
    tone: "orange",
    icon: Megaphone,
    sectionId: "marketing-sales",
    nextAction: "Plan your launch strategy, channels, and go-to-market budget.",
    blockers: [],
    evidence: [],
    linkedTaskIds: [],
    linkedDocumentIds: []
  },
  {
    id: "export",
    phase: "06",
    title: "Export",
    description: "Resolve final review checkpoints and prepare the lender, partner, or investor-ready plan.",
    owner: "Unassigned",
    readiness: 0,
    status: "queued",
    tone: "green",
    icon: FileCheck2,
    sectionId: "executive-summary",
    nextAction: "Complete all other stages before preparing your export-ready plan.",
    blockers: [],
    evidence: [],
    linkedTaskIds: [],
    linkedDocumentIds: []
  }
];

export const readinessBlockers: ReadinessBlocker[] = [
  {
    id: "blocker-template-1",
    stageId: "foundation",
    label: "Company registration pending",
    severity: "High",
    owner: "Founder",
    action: "Complete your company registration and attach the certificate."
  },
  {
    id: "blocker-template-2",
    stageId: "market-proof",
    label: "Market validation needed",
    severity: "Medium",
    owner: "Unassigned",
    action: "Conduct customer interviews and gather demand evidence."
  },
  {
    id: "blocker-template-3",
    stageId: "finance",
    label: "Financial model incomplete",
    severity: "High",
    owner: "Unassigned",
    action: "Build your revenue projections and cost base assumptions."
  }
];

export const evidenceItems: EvidenceItem[] = [
  {
    id: "evidence-template-1",
    stageId: "foundation",
    title: "Company registration certificate",
    source: "Company documents",
    status: "needed",
    detail: "Attach your official registration or incorporation document."
  },
  {
    id: "evidence-template-2",
    stageId: "market-proof",
    title: "Customer interview results",
    source: "Market research",
    status: "needed",
    detail: "Document at least 5 customer interviews validating demand."
  },
  {
    id: "evidence-template-3",
    stageId: "market-proof",
    title: "Competitor analysis",
    source: "Market research",
    status: "needed",
    detail: "Map your top 3 competitors with pricing and positioning."
  },
  {
    id: "evidence-template-4",
    stageId: "finance",
    title: "Financial projections workbook",
    source: "Financial planning",
    status: "needed",
    detail: "Create a spreadsheet with revenue, cost, and break-even models."
  }
];

export const studioActivity: StudioActivity[] = [];

export const exportCheckpoints: ExportCheckpoint[] = [
  {
    id: "checkpoint-1",
    label: "Narrative sections",
    status: "blocked",
    detail: "Complete all plan sections before export.",
    stageId: "foundation"
  },
  {
    id: "checkpoint-2",
    label: "Financial assumptions",
    status: "blocked",
    detail: "Build and validate your financial model.",
    stageId: "finance"
  },
  {
    id: "checkpoint-3",
    label: "Evidence appendix",
    status: "blocked",
    detail: "Gather and verify all supporting evidence.",
    stageId: "market-proof"
  },
  {
    id: "checkpoint-4",
    label: "Export packet",
    status: "blocked",
    detail: "All stages must be ready before final export.",
    stageId: "export"
  }
];

export const studioSignals: StudioSignal[] = [
  { label: "Plan completion", value: "0%", detail: "0 of 7 sections started", tone: "green" },
  { label: "Financial readiness", value: "0%", detail: "financial model not started", tone: "amber" },
  { label: "Evidence coverage", value: "0%", detail: "evidence items pending", tone: "blue" },
  { label: "Export readiness", value: "0%", detail: "complete stages to unlock", tone: "violet" }
];

export const highlights: Highlight[] = [
  {
    title: "Your Mission",
    body: "Define what your business aims to achieve and who it serves.",
    icon: Target,
    tone: "green"
  },
  {
    title: "Target Market",
    body: "Identify the customer segments most likely to buy from you.",
    icon: UsersRound,
    tone: "blue"
  },
  {
    title: "Competitive Edge",
    body: "Articulate why customers will choose you over alternatives.",
    icon: BarChart3,
    tone: "violet"
  },
  {
    title: "Revenue Goal",
    body: "Set a realistic first-year revenue target based on your model.",
    icon: CircleDollarSign,
    tone: "orange"
  }
];

export const financialMetrics: FinancialMetric[] = [];

export const revenueProjection: RevenueQuarter[] = [];

export const tasks: PlanTask[] = [];

export const documents: PlanDocument[] = [];

export const capabilityStrip: Capability[] = [
  {
    title: "SMB-Centric Solutions",
    body: "Built for small and medium business success.",
    icon: Target,
    tone: "blue"
  },
  {
    title: "POPIA Compliant",
    body: "Your data and privacy are our priority.",
    icon: ShieldCheck,
    tone: "green"
  },
  {
    title: "Local Support",
    body: "Expert support from our South African team.",
    icon: Headphones,
    tone: "violet"
  },
  {
    title: "Scalable Growth",
    body: "Solutions that grow with your business.",
    icon: Rocket,
    tone: "orange"
  }
];

export const workspaceNotes: WorkspaceNote[] = [];

export const appendixItems = [
  { title: "Founder profile", body: "Short biography, experience, and role in execution.", icon: BriefcaseBusiness },
  { title: "Evidence register", body: "Market interviews, competitor notes, and pricing proof.", icon: FileText },
  { title: "Financial workbook", body: "Source assumptions for revenue, margin, and break-even.", icon: FileSpreadsheet },
  { title: "Review checklist", body: "Final export readiness checks for each business plan section.", icon: BadgeCheck }
];

export const sectionWorkspaceStats = [
  { label: "Sections complete", value: "0 / 7" },
  { label: "Open tasks", value: "0" },
  { label: "Linked documents", value: "0" },
  { label: "Export readiness", value: "0%" }
];

export const getStageById = (stageId: BusinessStage["id"]) => businessStages.find((stage) => stage.id === stageId) ?? businessStages[0];

// ── Reference values ─────────────────────────────────────────────
// These example values are used as UI placeholders and test assertions.
// They represent what a completed business plan might look like.

export const referenceFinancials = {
  projectedRevenue: "ZAR 2.8M",
  breakEven: "Month 14",
  grossMargin: "70 - 80%"
} as const;

export const referenceDocuments = {
  businessPlan: "Business Plan v1.2",
  swotAnalysis: "SWOT Analysis.pptx"
} as const;
