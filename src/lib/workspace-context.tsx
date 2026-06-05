import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { ReactNode } from "react";

import type {
  PlanSection,
  BusinessStage,
  ReadinessBlocker,
  EvidenceItem,
  StudioActivity,
  ExportCheckpoint,
  Highlight,
  FinancialMetric,
  RevenueQuarter,
  PlanTask,
  PlanDocument,
  WorkspaceNote,
  StudioSignal
} from "@/data/kancatura";
import {
  capabilityStrip,
  appendixItems,
  sectionWorkspaceStats,
  planSummary as seedSummary
} from "@/data/kancatura";

import {
  getDatabase,
  seedDatabase,
  onDataChange,
  isNewWorkspace,
  getAllSections,
  getAllStages,
  getAllBlockers,
  getAllEvidence,
  getAllActivity,
  getAllCheckpoints,
  getAllHighlights,
  getAllMetrics,
  getAllRevenue,
  getAllTasks,
  getAllDocuments,
  getAllNotes,
  getPlanSummary,
  toggleTaskComplete as storeToggle,
  createTask as storeCreate,
  deleteTask as storeDelete,
  resolveBlocker as storeResolve,
  updateSection as storeUpdateSection,
  updateStage as storeUpdateStage,
  updatePlanSummary as storeUpdatePlan,
  resetDatabase as storeReset,
  exportAllData as storeExport,
  importData as storeImport
} from "@/lib/store";

import {
  getPreferences,
  setPreferences,
  onPreferencesChange,
  type UserPreferences
} from "@/lib/preferences";

// ── Types ────────────────────────────────────────────────────────

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

interface WorkspaceState {
  loading: boolean;
  isFirstRun: boolean;
  planSummary: PlanSummaryData;
  sections: PlanSection[];
  stages: BusinessStage[];
  blockers: (ReadinessBlocker & { resolved: boolean })[];
  evidence: EvidenceItem[];
  activity: StudioActivity[];
  checkpoints: ExportCheckpoint[];
  highlights: Highlight[];
  metrics: FinancialMetric[];
  revenue: RevenueQuarter[];
  tasks: PlanTask[];
  documents: PlanDocument[];
  notes: WorkspaceNote[];
  signals: StudioSignal[];
  preferences: UserPreferences;
}

interface WorkspaceActions {
  toggleTask: (taskId: string) => Promise<void>;
  addTask: (task: Omit<PlanTask, "id">) => Promise<string>;
  removeTask: (taskId: string) => Promise<void>;
  resolveBlocker: (blockerId: string) => Promise<void>;
  updateSection: (sectionId: string, updates: Partial<Pick<PlanSection, "completion" | "status" | "nextAction" | "notes" | "evidence">>) => Promise<void>;
  updateStage: (stageId: string, updates: Partial<Pick<BusinessStage, "readiness" | "status" | "nextAction" | "blockers">>) => Promise<void>;
  updateProfile: (updates: Partial<{ profileName: string; profileRole: string; market: string }>) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  completeOnboarding: (profile: { profileName: string; profileRole: string; market: string }) => Promise<void>;
  resetData: () => Promise<void>;
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
  getStageById: (stageId: string) => BusinessStage;
}

type WorkspaceContextType = WorkspaceState & WorkspaceActions;

// ── Context ──────────────────────────────────────────────────────

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

// ── Icon resolution ──────────────────────────────────────────────

function resolveIcon(iconName: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[iconName] ?? LucideIcons.Target;
}

function resolveIconsInStages(stages: Array<Omit<BusinessStage, "icon"> & { iconName?: string }>): BusinessStage[] {
  return stages.map(({ iconName, ...rest }) => ({
    ...rest,
    icon: resolveIcon(iconName ?? "Target")
  }));
}

function resolveIconsInHighlights(items: Array<Omit<Highlight, "icon"> & { iconName?: string }>): Highlight[] {
  return items.map(({ iconName, ...rest }) => ({
    ...rest,
    icon: resolveIcon(iconName ?? "Target")
  }));
}

// ── Compute signals from data ────────────────────────────────────

function computeSignals(
  sections: PlanSection[],
  plan: PlanSummaryData,
  evidenceCount: number,
  neededEvidenceCount: number
): StudioSignal[] {
  const readyCount = sections.filter((s) => s.status === "complete").length;
  const startedCount = sections.filter((s) => s.completion > 0).length;
  return [
    { label: "Plan completion", value: `${plan.completion}%`, detail: `${readyCount} of ${sections.length} sections complete`, tone: "green" },
    { label: "Financial readiness", value: `${plan.financialReadiness}%`, detail: startedCount > 0 ? `${startedCount} sections in progress` : "start your financial plan", tone: "amber" },
    { label: "Evidence coverage", value: `${plan.evidenceCoverage}%`, detail: neededEvidenceCount > 0 ? `${neededEvidenceCount} items needed` : `${evidenceCount} items collected`, tone: "blue" },
    { label: "Export readiness", value: `${plan.exportReadiness}%`, detail: readyCount === sections.length ? "ready to export" : `${sections.length - readyCount} sections remaining`, tone: "violet" }
  ];
}

// ── Provider ─────────────────────────────────────────────────────

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [planSummary, setPlanSummary] = useState<PlanSummaryData>(seedSummary);
  const [sections, setSections] = useState<PlanSection[]>([]);
  const [stages, setStages] = useState<BusinessStage[]>([]);
  const [blockers, setBlockers] = useState<(ReadinessBlocker & { resolved: boolean })[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [activity, setActivity] = useState<StudioActivity[]>([]);
  const [checkpoints, setCheckpoints] = useState<ExportCheckpoint[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetric[]>([]);
  const [revenue, setRevenue] = useState<RevenueQuarter[]>([]);
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [documents, setDocuments] = useState<PlanDocument[]>([]);
  const [notes, setNotes] = useState<WorkspaceNote[]>([]);
  const [preferences, setPreferencesState] = useState<UserPreferences>(getPreferences());
  const initRef = useRef(false);

  const loadAll = useCallback(async () => {
    try {
      const [
        planData,
        sectionsData,
        stagesRaw,
        blockersData,
        evidenceData,
        activityData,
        checkpointsData,
        highlightsRaw,
        metricsData,
        revenueData,
        tasksData,
        documentsData,
        notesData
      ] = await Promise.all([
        getPlanSummary(),
        getAllSections(),
        getAllStages(),
        getAllBlockers(),
        getAllEvidence(),
        getAllActivity(),
        getAllCheckpoints(),
        getAllHighlights(),
        getAllMetrics(),
        getAllRevenue(),
        getAllTasks(),
        getAllDocuments(),
        getAllNotes()
      ]);

      if (planData) {
        setPlanSummary(planData);
      }
      setSections(sectionsData);
      setStages(resolveIconsInStages(stagesRaw));
      setBlockers(blockersData);
      setEvidence(evidenceData);
      setActivity(activityData);
      setCheckpoints(checkpointsData);
      setHighlights(resolveIconsInHighlights(highlightsRaw));
      setMetrics(metricsData);
      setRevenue(revenueData);
      setTasks(tasksData);
      setDocuments(documentsData);
      setNotes(notesData);
    } catch (err) {
      console.error("Failed to load workspace data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize database and load data
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    (async () => {
      await getDatabase();
      const isNew = await isNewWorkspace();
      setIsFirstRun(isNew);
      await seedDatabase();
      await loadAll();
    })();
  }, [loadAll]);

  // Listen for data changes
  useEffect(() => {
    return onDataChange(() => {
      loadAll();
    });
  }, [loadAll]);

  // Listen for preference changes
  useEffect(() => {
    return onPreferencesChange(() => {
      setPreferencesState(getPreferences());
    });
  }, []);

  const signals = useMemo(() => {
    const neededEvidence = evidence.filter((e) => e.status === "needed").length;
    return computeSignals(sections, planSummary, evidence.length, neededEvidence);
  }, [sections, planSummary, evidence]);

  // ── Actions ──────────────────────────────────────────────────

  const toggleTask = useCallback(async (taskId: string) => {
    await storeToggle(taskId);
  }, []);

  const addTask = useCallback(async (task: Omit<PlanTask, "id">) => {
    return await storeCreate(task);
  }, []);

  const removeTask = useCallback(async (taskId: string) => {
    await storeDelete(taskId);
  }, []);

  const resolveBlocker = useCallback(async (blockerId: string) => {
    await storeResolve(blockerId);
  }, []);

  const updateSectionAction = useCallback(async (
    sectionId: string,
    updates: Partial<Pick<PlanSection, "completion" | "status" | "nextAction" | "notes" | "evidence">>
  ) => {
    await storeUpdateSection(sectionId, updates);
  }, []);

  const updateStageAction = useCallback(async (
    stageId: string,
    updates: Partial<Pick<BusinessStage, "readiness" | "status" | "nextAction" | "blockers">>
  ) => {
    await storeUpdateStage(stageId, updates);
  }, []);

  const updateProfile = useCallback(async (
    updates: Partial<{ profileName: string; profileRole: string; market: string }>
  ) => {
    await storeUpdatePlan(updates);
  }, []);

  const updatePreferencesAction = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences(updates);
  }, []);

  const completeOnboarding = useCallback(async (
    profile: { profileName: string; profileRole: string; market: string }
  ) => {
    await storeUpdatePlan(profile);
    setIsFirstRun(false);
  }, []);

  const resetData = useCallback(async () => {
    await storeReset();
  }, []);

  const exportData = useCallback(async () => {
    return await storeExport();
  }, []);

  const importDataAction = useCallback(async (json: string) => {
    await storeImport(json);
  }, []);

  const getStageById = useCallback((stageId: string): BusinessStage => {
    return stages.find((s) => s.id === stageId) ?? stages[0];
  }, [stages]);

  // ── Context value ────────────────────────────────────────────

  const value = useMemo<WorkspaceContextType>(() => ({
    loading,
    isFirstRun,
    planSummary,
    sections,
    stages,
    blockers,
    evidence,
    activity,
    checkpoints,
    highlights,
    metrics,
    revenue,
    tasks,
    documents,
    notes,
    signals,
    preferences,
    toggleTask,
    addTask,
    removeTask,
    resolveBlocker,
    updateSection: updateSectionAction,
    updateStage: updateStageAction,
    updateProfile,
    updatePreferences: updatePreferencesAction,
    completeOnboarding,
    resetData,
    exportData,
    importData: importDataAction,
    getStageById
  }), [
    loading, isFirstRun, planSummary, sections, stages, blockers, evidence, activity,
    checkpoints, highlights, metrics, revenue, tasks, documents, notes,
    signals, preferences, toggleTask, addTask, removeTask, resolveBlocker,
    updateSectionAction, updateStageAction, updateProfile, updatePreferencesAction,
    completeOnboarding, resetData, exportData, importDataAction, getStageById
  ]);

  return (
    <WorkspaceContext value={value}>
      {children}
    </WorkspaceContext>
  );
}

// ── Hook ─────────────────────────────────────────────────────────

export function useWorkspace(): WorkspaceContextType {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}

// ── Re-export static data ────────────────────────────────────────

export { capabilityStrip, appendixItems, sectionWorkspaceStats };
