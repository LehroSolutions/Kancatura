// Workspace exports are user-supplied JSON, so nothing in an import is trusted.
// Every record is rebuilt from a per-store field allowlist before it reaches
// IndexedDB: unknown keys are dropped, over-long strings are truncated,
// out-of-range numbers are clamped, and missing optional fields are defaulted.
//
// A record is rejected outright only when it could not be made safe: it is not an
// object, its IndexedDB key is missing or not a string, or a field has the wrong
// type or an out-of-vocabulary enum. Any rejection aborts the whole import so a
// file can never be half-applied.

import type {
  EvidenceItem,
  ExportCheckpoint,
  Highlight,
  PlanDocument,
  PlanSection,
  SectionStatus,
  StageStatus,
  StudioTone
} from "../data/kancatura";

export type StoreName =
  | "plan"
  | "planSections"
  | "businessStages"
  | "readinessBlockers"
  | "evidenceItems"
  | "studioActivity"
  | "exportCheckpoints"
  | "highlights"
  | "financialMetrics"
  | "revenueProjection"
  | "planTasks"
  | "planDocuments"
  | "workspaceNotes";

export const WORKSPACE_STORES: StoreName[] = [
  "plan", "planSections", "businessStages", "readinessBlockers",
  "evidenceItems", "studioActivity", "exportCheckpoints",
  "highlights", "financialMetrics", "revenueProjection",
  "planTasks", "planDocuments", "workspaceNotes"
];

export const MAX_RECORDS_PER_STORE = 500;

const MAX_LABEL = 120;
const MAX_TEXT = 4000;
const MAX_LIST_ITEMS = 50;
const MAX_TREND_POINTS = 36;
const MAX_CURRENCY = 1_000_000_000_000;
const MAX_ORDER = 10_000;

// Keep these literals in sync with the unions in src/data/kancatura.ts; the
// `satisfies` clauses make a typo or a renamed member a compile error.
const SECTION_STATUSES = ["complete", "review", "draft"] as const satisfies readonly SectionStatus[];
const STAGE_STATUSES = ["complete", "active", "blocked", "queued"] as const satisfies readonly StageStatus[];
const STUDIO_TONES = ["green", "blue", "violet", "orange", "amber"] as const satisfies readonly StudioTone[];
const HIGHLIGHT_TONES = ["green", "blue", "violet", "orange"] as const satisfies readonly Highlight["tone"][];
const RISK_LEVELS = ["Low", "Medium", "High"] as const satisfies readonly PlanSection["risk"][];
const EVIDENCE_STATUSES = ["verified", "review", "draft", "needed"] as const satisfies readonly EvidenceItem["status"][];
const CHECKPOINT_STATUSES = ["ready", "review", "blocked"] as const satisfies readonly ExportCheckpoint["status"][];
const DOCUMENT_KINDS = ["DOCX", "XLSX", "PDF", "PPTX"] as const satisfies readonly PlanDocument["kind"][];

// ── Field rules ───────────────────────────────────────────────────

type FieldRule =
  | { kind: "text"; max: number; fallback?: string; required?: boolean }
  | { kind: "enum"; values: readonly string[] }
  | { kind: "percent" }
  | { kind: "currency" }
  | { kind: "order" }
  | { kind: "flag" }
  | { kind: "timestamp" }
  | { kind: "textList"; max: number }
  | { kind: "numberList"; max: number };

type StoreSpec = Record<string, FieldRule>;

const text = (max: number): FieldRule => ({ kind: "text", max });
const label = (): FieldRule => text(MAX_LABEL);
const body = (): FieldRule => text(MAX_TEXT);
const requiredLabel = (): FieldRule => ({ kind: "text", max: MAX_LABEL, required: true });
const optionalLabel = (): FieldRule => ({ kind: "text", max: MAX_LABEL, fallback: "" });
const enumOf = (values: readonly string[]): FieldRule => ({ kind: "enum", values });
const percent = (): FieldRule => ({ kind: "percent" });
const currency = (): FieldRule => ({ kind: "currency" });
const flag = (): FieldRule => ({ kind: "flag" });
const timestamp = (): FieldRule => ({ kind: "timestamp" });
const textList = (): FieldRule => ({ kind: "textList", max: MAX_LIST_ITEMS });
const numberList = (): FieldRule => ({ kind: "numberList", max: MAX_TREND_POINTS });
const order = (): FieldRule => ({ kind: "order" });

const STORE_SPECS: Record<StoreName, StoreSpec> = {
  plan: {
    id: requiredLabel(),
    brand: requiredLabel(),
    brandSuffix: label(),
    title: body(),
    subtitle: body(),
    completion: percent(),
    financialReadiness: percent(),
    evidenceCoverage: percent(),
    exportReadiness: percent(),
    lastSaved: label(),
    profileName: label(),
    profileRole: label(),
    market: label(),
    currentStageId: optionalLabel()
  },
  planSections: {
    id: requiredLabel(),
    stageId: requiredLabel(),
    title: body(),
    description: body(),
    completion: percent(),
    status: enumOf(SECTION_STATUSES),
    owner: label(),
    updatedAt: label(),
    evidence: body(),
    risk: enumOf(RISK_LEVELS),
    nextAction: body(),
    notes: textList(),
    _updatedAt: timestamp()
  },
  businessStages: {
    id: requiredLabel(),
    phase: label(),
    title: body(),
    description: body(),
    owner: label(),
    readiness: percent(),
    status: enumOf(STAGE_STATUSES),
    tone: enumOf(STUDIO_TONES),
    iconName: optionalLabel(),
    sectionId: optionalLabel(),
    nextAction: body(),
    blockers: textList(),
    evidence: textList(),
    linkedTaskIds: textList(),
    linkedDocumentIds: textList(),
    _updatedAt: timestamp()
  },
  readinessBlockers: {
    id: requiredLabel(),
    stageId: requiredLabel(),
    label: body(),
    severity: enumOf(RISK_LEVELS),
    owner: label(),
    action: body(),
    resolved: flag(),
    _updatedAt: timestamp()
  },
  evidenceItems: {
    id: requiredLabel(),
    stageId: requiredLabel(),
    title: body(),
    source: body(),
    status: enumOf(EVIDENCE_STATUSES),
    detail: body(),
    _updatedAt: timestamp()
  },
  studioActivity: {
    id: requiredLabel(),
    actor: label(),
    action: body(),
    target: body(),
    timestamp: label(),
    tone: enumOf(STUDIO_TONES),
    _createdAt: timestamp()
  },
  exportCheckpoints: {
    id: requiredLabel(),
    label: body(),
    status: enumOf(CHECKPOINT_STATUSES),
    detail: body(),
    stageId: optionalLabel(),
    _updatedAt: timestamp()
  },
  highlights: {
    title: requiredLabel(),
    body: body(),
    iconName: optionalLabel(),
    tone: enumOf(HIGHLIGHT_TONES),
    order: order()
  },
  financialMetrics: {
    label: requiredLabel(),
    value: label(),
    status: label(),
    delta: label(),
    tone: enumOf(STUDIO_TONES),
    trend: numberList(),
    order: order()
  },
  revenueProjection: {
    quarter: requiredLabel(),
    yearOne: currency(),
    yearTwo: currency(),
    yearThree: currency(),
    margin: percent(),
    order: order()
  },
  planTasks: {
    id: requiredLabel(),
    stageId: requiredLabel(),
    label: body(),
    due: label(),
    complete: flag(),
    owner: label(),
    _updatedAt: timestamp()
  },
  planDocuments: {
    id: requiredLabel(),
    stageId: requiredLabel(),
    name: body(),
    kind: enumOf(DOCUMENT_KINDS),
    updatedAt: label(),
    status: label(),
    _updatedAt: timestamp()
  },
  workspaceNotes: {
    title: requiredLabel(),
    body: body(),
    updatedAt: label(),
    _updatedAt: timestamp()
  }
};

// The app only ever addresses the singleton plan row, so an import must not
// introduce a second one.
const PLAN_RECORD_ID = "default";

function reject(store: StoreName, index: number, detail: string): Error {
  return new Error(`Record ${index + 1} in "${store}" was rejected: ${detail}.`);
}

function coerceField(
  store: StoreName,
  index: number,
  field: string,
  value: unknown,
  rule: FieldRule
): unknown {
  // A field absent from the export falls back to a safe default; a field that is
  // present but malformed is a hard rejection.
  if (value === undefined || value === null) {
    switch (rule.kind) {
      case "text":
        if (rule.required) throw reject(store, index, `"${field}" is required`);
        return rule.fallback ?? "";
      case "percent":
      case "currency":
      case "order":
      case "timestamp":
        return 0;
      case "flag":
        return false;
      case "textList":
      case "numberList":
        return [];
      case "enum":
        throw reject(store, index, `"${field}" is required`);
    }
  }

  switch (rule.kind) {
    case "text": {
      if (typeof value !== "string") throw reject(store, index, `"${field}" must be text`);
      const truncated = value.slice(0, rule.max);
      if (rule.required && truncated.length === 0) throw reject(store, index, `"${field}" is required`);
      return truncated;
    }
    case "enum": {
      if (typeof value !== "string" || !rule.values.includes(value)) {
        throw reject(store, index, `"${field}" must be one of ${rule.values.join(", ")}`);
      }
      return value;
    }
    case "percent": {
      const numeric = toFiniteNumber(value);
      if (numeric === null) throw reject(store, index, `"${field}" must be a finite number`);
      return Math.min(100, Math.max(0, numeric));
    }
    case "currency": {
      const numeric = toFiniteNumber(value);
      if (numeric === null) throw reject(store, index, `"${field}" must be a finite number`);
      return Math.min(MAX_CURRENCY, Math.max(0, numeric));
    }
    case "order": {
      const numeric = toFiniteNumber(value);
      if (numeric === null) throw reject(store, index, `"${field}" must be a finite number`);
      return Math.min(MAX_ORDER, Math.max(0, Math.round(numeric)));
    }
    case "flag":
      return typeof value === "boolean" ? value : false;
    case "timestamp": {
      const numeric = toFiniteNumber(value);
      return numeric === null ? 0 : Math.max(0, numeric);
    }
    case "textList": {
      if (!Array.isArray(value)) throw reject(store, index, `"${field}" must be a list`);
      return value
        .filter((entry): entry is string => typeof entry === "string")
        .slice(0, rule.max)
        .map((entry) => entry.slice(0, MAX_LABEL));
    }
    case "numberList": {
      if (!Array.isArray(value)) throw reject(store, index, `"${field}" must be a list`);
      const numeric = value.filter((entry): entry is number => toFiniteNumber(entry) !== null);
      return numeric.slice(-rule.max);
    }
  }
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

export function sanitizeStoreRecords(store: StoreName, items: unknown[]): Record<string, unknown>[] {
  const spec = STORE_SPECS[store];
  return items.map((item, index) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw reject(store, index, "expected an object");
    }

    const record: Record<string, unknown> = {};
    for (const [field, rule] of Object.entries(spec)) {
      record[field] = coerceField(store, index, field, (item as Record<string, unknown>)[field], rule);
    }
    if (store === "plan") record.id = PLAN_RECORD_ID;
    return record;
  });
}

export type WorkspaceImport = {
  records: Partial<Record<StoreName, Record<string, unknown>[]>>;
  storeCount: number;
};

export function parseWorkspaceImport(jsonString: string): WorkspaceImport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("Invalid JSON format. Please check the file and try again.");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Invalid data format. Expected a workspace export file.");
  }

  const source = parsed as Record<string, unknown>;
  const records: Partial<Record<StoreName, Record<string, unknown>[]>> = {};

  for (const name of Object.keys(source)) {
    if (!WORKSPACE_STORES.includes(name as StoreName) || !Array.isArray(source[name])) continue;
    const items = source[name] as unknown[];
    if (items.length > MAX_RECORDS_PER_STORE) {
      throw new Error(`Too many records in "${name}" (max ${MAX_RECORDS_PER_STORE}).`);
    }
    records[name as StoreName] = sanitizeStoreRecords(name as StoreName, items);
  }

  const storeNames = Object.keys(records) as StoreName[];
  if (storeNames.length === 0) {
    throw new Error("No valid workspace data found in the file.");
  }

  return { records, storeCount: storeNames.length };
}
