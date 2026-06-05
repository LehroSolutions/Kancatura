import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import {
  planSections as seedSections,
  businessStages as seedStages,
  readinessBlockers as seedBlockers,
  evidenceItems as seedEvidence,
  studioActivity as seedActivity,
  exportCheckpoints as seedCheckpoints,
  highlights as seedHighlights,
  financialMetrics as seedMetrics,
  revenueProjection as seedRevenue,
  tasks as seedTasks,
  documents as seedDocuments,
  planSummary,
  workspaceNotes as seedNotes,
  type PlanSection,
  type BusinessStage,
  type ReadinessBlocker,
  type EvidenceItem,
  type StudioActivity,
  type ExportCheckpoint,
  type Highlight,
  type FinancialMetric,
  type RevenueQuarter,
  type PlanTask,
  type PlanDocument,
  type WorkspaceNote
} from "@/data/kancatura";

// ── Database schema ──────────────────────────────────────────────

interface KancaturaDB extends DBSchema {
  plan: {
    key: string;
    value: {
      id: string;
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
    };
  };
  planSections: {
    key: string;
    value: PlanSection & { _updatedAt: number };
    indexes: { byStage: string };
  };
  businessStages: {
    key: string;
    value: Omit<BusinessStage, "icon"> & { iconName: string; _updatedAt: number };
  };
  readinessBlockers: {
    key: string;
    value: ReadinessBlocker & { resolved: boolean; _updatedAt: number };
    indexes: { byStage: string };
  };
  evidenceItems: {
    key: string;
    value: EvidenceItem & { _updatedAt: number };
    indexes: { byStage: string };
  };
  studioActivity: {
    key: string;
    value: StudioActivity & { _createdAt: number };
  };
  exportCheckpoints: {
    key: string;
    value: ExportCheckpoint & { _updatedAt: number };
  };
  highlights: {
    key: string;
    value: Omit<Highlight, "icon"> & { iconName: string; order: number };
  };
  financialMetrics: {
    key: string;
    value: FinancialMetric & { order: number };
  };
  revenueProjection: {
    key: string;
    value: RevenueQuarter & { order: number };
  };
  planTasks: {
    key: string;
    value: PlanTask & { _updatedAt: number };
    indexes: { byStage: string };
  };
  planDocuments: {
    key: string;
    value: PlanDocument & { _updatedAt: number };
    indexes: { byStage: string };
  };
  workspaceNotes: {
    key: string;
    value: WorkspaceNote & { _updatedAt: number };
  };
}

// ── Icon name mapping (icons can't be stored in IndexedDB) ───────

const iconNames: Record<string, string> = {
  BriefcaseBusiness: "BriefcaseBusiness",
  UsersRound: "UsersRound",
  ClipboardCheck: "ClipboardCheck",
  WalletCards: "WalletCards",
  Megaphone: "Megaphone",
  FileCheck2: "FileCheck2",
  Target: "Target",
  BarChart3: "BarChart3",
  CircleDollarSign: "CircleDollarSign",
  ShieldCheck: "ShieldCheck",
  Headphones: "Headphones",
  Rocket: "Rocket"
};

function getIconName(icon: { name?: string } | object): string {
  const iconObj = icon as { name?: string; displayName?: string };
  return iconObj.name ?? iconObj.displayName ?? "Target";
}

// ── Database instance ────────────────────────────────────────────

const DB_NAME = "kancatura-workspace";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<KancaturaDB>> | null = null;

export function getDatabase(): Promise<IDBPDatabase<KancaturaDB>> {
  if (!dbPromise) {
    dbPromise = openDB<KancaturaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Plan
        db.createObjectStore("plan", { keyPath: "id" });

        // Plan sections
        const sectionsStore = db.createObjectStore("planSections", { keyPath: "id" });
        sectionsStore.createIndex("byStage", "stageId");

        // Business stages
        db.createObjectStore("businessStages", { keyPath: "id" });

        // Readiness blockers
        const blockersStore = db.createObjectStore("readinessBlockers", { keyPath: "id" });
        blockersStore.createIndex("byStage", "stageId");

        // Evidence items
        const evidenceStore = db.createObjectStore("evidenceItems", { keyPath: "id" });
        evidenceStore.createIndex("byStage", "stageId");

        // Studio activity
        db.createObjectStore("studioActivity", { keyPath: "id" });

        // Export checkpoints
        db.createObjectStore("exportCheckpoints", { keyPath: "id" });

        // Highlights
        db.createObjectStore("highlights", { keyPath: "title" });

        // Financial metrics
        db.createObjectStore("financialMetrics", { keyPath: "label" });

        // Revenue projection
        db.createObjectStore("revenueProjection", { keyPath: "quarter" });

        // Plan tasks
        const tasksStore = db.createObjectStore("planTasks", { keyPath: "id" });
        tasksStore.createIndex("byStage", "stageId");

        // Plan documents
        const docsStore = db.createObjectStore("planDocuments", { keyPath: "id" });
        docsStore.createIndex("byStage", "stageId");

        // Workspace notes
        db.createObjectStore("workspaceNotes", { keyPath: "title" });
      }
    });
  }
  return dbPromise;
}

// ── Seed database ────────────────────────────────────────────────

export async function seedDatabase(): Promise<void> {
  const db = await getDatabase();

  // Check if already seeded
  const existingPlan = await db.get("plan", "default");
  if (existingPlan) return;

  const now = Date.now();
  const tx = db.transaction(
    [
      "plan", "planSections", "businessStages", "readinessBlockers",
      "evidenceItems", "studioActivity", "exportCheckpoints",
      "highlights", "financialMetrics", "revenueProjection",
      "planTasks", "planDocuments", "workspaceNotes"
    ],
    "readwrite"
  );

  // Seed plan
  await tx.objectStore("plan").put({
    id: "default",
    brand: planSummary.brand,
    brandSuffix: planSummary.brandSuffix,
    title: planSummary.title,
    subtitle: planSummary.subtitle,
    completion: planSummary.completion,
    financialReadiness: planSummary.financialReadiness,
    evidenceCoverage: planSummary.evidenceCoverage,
    exportReadiness: planSummary.exportReadiness,
    lastSaved: planSummary.lastSaved,
    profileName: planSummary.profileName,
    profileRole: planSummary.profileRole,
    market: planSummary.market,
    currentStageId: planSummary.currentStageId
  });

  // Seed sections
  for (const section of seedSections) {
    await tx.objectStore("planSections").put({ ...section, _updatedAt: now });
  }

  // Seed stages
  for (const stage of seedStages) {
    const { icon, ...rest } = stage;
    await tx.objectStore("businessStages").put({
      ...rest,
      iconName: getIconName(icon),
      _updatedAt: now
    });
  }

  // Seed blockers
  for (const blocker of seedBlockers) {
    await tx.objectStore("readinessBlockers").put({ ...blocker, resolved: false, _updatedAt: now });
  }

  // Seed evidence
  for (const item of seedEvidence) {
    await tx.objectStore("evidenceItems").put({ ...item, _updatedAt: now });
  }

  // Seed activity
  for (const activity of seedActivity) {
    await tx.objectStore("studioActivity").put({ ...activity, _createdAt: now });
  }

  // Seed checkpoints
  for (const checkpoint of seedCheckpoints) {
    await tx.objectStore("exportCheckpoints").put({ ...checkpoint, _updatedAt: now });
  }

  // Seed highlights
  seedHighlights.forEach((h, i) => {
    const { icon, ...rest } = h;
    tx.objectStore("highlights").put({ ...rest, iconName: getIconName(icon), order: i });
  });

  // Seed metrics
  seedMetrics.forEach((m, i) => {
    tx.objectStore("financialMetrics").put({ ...m, order: i });
  });

  // Seed revenue
  seedRevenue.forEach((r, i) => {
    tx.objectStore("revenueProjection").put({ ...r, order: i });
  });

  // Seed tasks
  for (const task of seedTasks) {
    await tx.objectStore("planTasks").put({ ...task, _updatedAt: now });
  }

  // Seed documents
  for (const doc of seedDocuments) {
    await tx.objectStore("planDocuments").put({ ...doc, _updatedAt: now });
  }

  // Seed notes
  for (const note of seedNotes) {
    await tx.objectStore("workspaceNotes").put({ ...note, _updatedAt: now });
  }

  await tx.done;
  dispatchChange();
}

// ── Event bus for reactivity ─────────────────────────────────────

const CHANGE_EVENT = "kancatura:data-change";

function dispatchChange(): void {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function onDataChange(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

// ── Read operations ──────────────────────────────────────────────

export async function getPlanSummary() {
  const db = await getDatabase();
  return db.get("plan", "default");
}

export async function getAllSections(): Promise<PlanSection[]> {
  const db = await getDatabase();
  const all = await db.getAll("planSections");
  return all.map(({ _updatedAt, ...rest }) => rest);
}

export async function getAllStages(): Promise<Array<Omit<BusinessStage, "icon"> & { iconName: string }>> {
  const db = await getDatabase();
  const all = await db.getAll("businessStages");
  return all.map(({ _updatedAt, ...rest }) => rest);
}

export async function getAllBlockers(): Promise<(ReadinessBlocker & { resolved: boolean })[]> {
  const db = await getDatabase();
  const all = await db.getAll("readinessBlockers");
  return all.map(({ _updatedAt, ...rest }) => rest);
}

export async function getAllEvidence(): Promise<EvidenceItem[]> {
  const db = await getDatabase();
  const all = await db.getAll("evidenceItems");
  return all.map(({ _updatedAt, ...rest }) => rest);
}

export async function getAllActivity(): Promise<StudioActivity[]> {
  const db = await getDatabase();
  const all = await db.getAll("studioActivity");
  return all.map(({ _createdAt, ...rest }) => rest);
}

export async function getAllCheckpoints(): Promise<ExportCheckpoint[]> {
  const db = await getDatabase();
  const all = await db.getAll("exportCheckpoints");
  return all.map(({ _updatedAt, ...rest }) => rest);
}

export async function getAllHighlights(): Promise<Array<Omit<Highlight, "icon"> & { iconName: string; order: number }>> {
  const db = await getDatabase();
  const all = await db.getAll("highlights");
  return all.sort((a, b) => a.order - b.order);
}

export async function getAllMetrics(): Promise<FinancialMetric[]> {
  const db = await getDatabase();
  const all = await db.getAll("financialMetrics");
  return all
    .sort((a, b) => a.order - b.order)
    .map(({ order, ...rest }) => rest);
}

export async function getAllRevenue(): Promise<RevenueQuarter[]> {
  const db = await getDatabase();
  const all = await db.getAll("revenueProjection");
  return all
    .sort((a, b) => a.order - b.order)
    .map(({ order, ...rest }) => rest);
}

export async function getAllTasks(): Promise<PlanTask[]> {
  const db = await getDatabase();
  const all = await db.getAll("planTasks");
  return all.map(({ _updatedAt, ...rest }) => rest);
}

export async function getAllDocuments(): Promise<PlanDocument[]> {
  const db = await getDatabase();
  const all = await db.getAll("planDocuments");
  return all.map(({ _updatedAt, ...rest }) => rest);
}

export async function getAllNotes(): Promise<WorkspaceNote[]> {
  const db = await getDatabase();
  const all = await db.getAll("workspaceNotes");
  return all.map(({ _updatedAt, ...rest }) => rest);
}

// ── Mutation operations ──────────────────────────────────────────

export async function toggleTaskComplete(taskId: string): Promise<void> {
  const db = await getDatabase();
  const task = await db.get("planTasks", taskId);
  if (!task) return;
  await db.put("planTasks", { ...task, complete: !task.complete, _updatedAt: Date.now() });
  await updateLastSaved();
  dispatchChange();
}

export async function createTask(task: Omit<PlanTask, "id">): Promise<string> {
  const db = await getDatabase();
  const id = `task-${Date.now()}`;
  await db.put("planTasks", { ...task, id, _updatedAt: Date.now() });
  await updateLastSaved();
  dispatchChange();
  return id;
}

export async function deleteTask(taskId: string): Promise<void> {
  const db = await getDatabase();
  await db.delete("planTasks", taskId);
  await updateLastSaved();
  dispatchChange();
}

export async function resolveBlocker(blockerId: string): Promise<void> {
  const db = await getDatabase();
  const blocker = await db.get("readinessBlockers", blockerId);
  if (!blocker) return;
  await db.put("readinessBlockers", { ...blocker, resolved: true, _updatedAt: Date.now() });
  await updateLastSaved();
  dispatchChange();
}

export async function updateSection(
  sectionId: string,
  updates: Partial<Pick<PlanSection, "completion" | "status" | "nextAction" | "notes" | "evidence">>
): Promise<void> {
  const db = await getDatabase();
  const section = await db.get("planSections", sectionId);
  if (!section) return;
  await db.put("planSections", { ...section, ...updates, _updatedAt: Date.now() });
  await updateLastSaved();
  dispatchChange();
}

export async function updateStage(
  stageId: string,
  updates: Partial<Pick<BusinessStage, "readiness" | "status" | "nextAction" | "blockers">>
): Promise<void> {
  const db = await getDatabase();
  const stage = await db.get("businessStages", stageId);
  if (!stage) return;
  await db.put("businessStages", { ...stage, ...updates, _updatedAt: Date.now() });
  await updateLastSaved();
  dispatchChange();
}

export async function updatePlanSummary(
  updates: Partial<{ profileName: string; profileRole: string; market: string }>
): Promise<void> {
  const db = await getDatabase();
  const plan = await db.get("plan", "default");
  if (!plan) return;
  await db.put("plan", { ...plan, ...updates });
  await updateLastSaved();
  dispatchChange();
}

type StoreName = "plan" | "planSections" | "businessStages" | "readinessBlockers" |
  "evidenceItems" | "studioActivity" | "exportCheckpoints" |
  "highlights" | "financialMetrics" | "revenueProjection" |
  "planTasks" | "planDocuments" | "workspaceNotes";

const ALL_STORES: StoreName[] = [
  "plan", "planSections", "businessStages", "readinessBlockers",
  "evidenceItems", "studioActivity", "exportCheckpoints",
  "highlights", "financialMetrics", "revenueProjection",
  "planTasks", "planDocuments", "workspaceNotes"
];

export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction(ALL_STORES, "readwrite");
  for (const name of ALL_STORES) {
    await tx.objectStore(name).clear();
  }
  await tx.done;
  await seedDatabase();
}

export async function exportAllData(): Promise<string> {
  const db = await getDatabase();
  const data: Record<string, unknown[]> = {};
  for (const name of ALL_STORES) {
    data[name] = await db.getAll(name);
  }
  return JSON.stringify(data, null, 2);
}

export async function isNewWorkspace(): Promise<boolean> {
  const db = await getDatabase();
  const existingPlan = await db.get("plan", "default");
  return !existingPlan;
}

export async function importData(jsonString: string): Promise<void> {
  let data: Record<string, unknown[]>;
  try {
    data = JSON.parse(jsonString) as Record<string, unknown[]>;
  } catch {
    throw new Error("Invalid JSON format. Please check the file and try again.");
  }

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Invalid data format. Expected a workspace export file.");
  }

  const validStores = Object.keys(data).filter(
    (k): k is StoreName => ALL_STORES.includes(k as StoreName) && Array.isArray(data[k])
  );

  if (validStores.length === 0) {
    throw new Error("No valid workspace data found in the file.");
  }

  const db = await getDatabase();
  const tx = db.transaction(validStores, "readwrite");
  for (const name of validStores) {
    await tx.objectStore(name).clear();
    for (const item of data[name]) {
      await tx.objectStore(name).put(item as never);
    }
  }
  await tx.done;
  await updateLastSaved();
  dispatchChange();
}

// ── Helpers ──────────────────────────────────────────────────────

async function updateLastSaved(): Promise<void> {
  const db = await getDatabase();
  const plan = await db.get("plan", "default");
  if (!plan) return;
  const now = new Date();
  const formatted = now.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true
  });
  await db.put("plan", { ...plan, lastSaved: formatted });
}
