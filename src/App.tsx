import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpenCheck,
  Building2,
  ChartColumnIncreasing,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  ClipboardCheck,
  Clock3,
  Database,
  Download,
  FileArchive,
  FileChartColumn,
  FileCheck2,
  FileText,
  Gauge,
  Home,
  Layers3,
  ListChecks,
  Menu,
  MoreVertical,
  NotebookText,
  Palette,
  Plus,
  Save,
  Search,
  Settings,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  User,
  X
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownItem, DropdownSeparator } from "@/components/ui/dropdown-menu";
import { useWorkspace, capabilityStrip, appendixItems, sectionWorkspaceStats } from "@/lib/workspace-context";
import {
  type BusinessStage,
  type EvidenceItem,
  type ExportCheckpoint,
  type FinancialMetric,
  type Highlight,
  type PlanDocument,
  type PlanSection,
  type PlanTask,
  type ReadinessBlocker,
  type StageStatus,
  type StudioActivity,
  type StudioSignal,
  type StudioTone
} from "@/data/kancatura";
import { isLocalFirst, appVersion } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import { downloadBusinessPlanPdf } from "@/lib/pdf-export";

type WorkspaceTabId =
  | "dashboard"
  | "executive-summary"
  | "company-overview"
  | "business-description"
  | "market-analysis"
  | "operating-plan"
  | "marketing-sales"
  | "financial-plan"
  | "appendix"
  | "documents"
  | "tasks"
  | "notes"
  | "settings";

type WorkspaceTab = {
  id: WorkspaceTabId;
  label: string;
  icon: LucideIcon;
  sectionId?: PlanSection["id"];
  count?: number;
  dividerBefore?: boolean;
};

const tabIcons: Record<string, LucideIcon> = {
  dashboard: Home,
  "executive-summary": NotebookText,
  "company-overview": Building2,
  "business-description": FileText,
  "market-analysis": ChartColumnIncreasing,
  "operating-plan": ClipboardCheck,
  "marketing-sales": TrendingUp,
  "financial-plan": Gauge,
  appendix: FileArchive,
  documents: FileChartColumn,
  tasks: ListChecks,
  notes: BookOpenCheck,
  settings: Settings
};

const tabLabels: Record<string, string> = {
  dashboard: "Dashboard",
  "executive-summary": "Executive Summary",
  "company-overview": "Company Overview",
  "business-description": "Business Description",
  "market-analysis": "Market Analysis",
  "operating-plan": "Operating Plan",
  "marketing-sales": "Marketing & Sales Plan",
  "financial-plan": "Financial Plan",
  appendix: "Appendix",
  documents: "Documents",
  tasks: "Tasks",
  notes: "Notes",
  settings: "Settings"
};

const sectionTabs: Partial<Record<string, string>> = {
  "executive-summary": "executive-summary",
  "company-overview": "company-overview",
  "business-description": "business-description",
  "market-analysis": "market-analysis",
  "operating-plan": "operating-plan",
  "marketing-sales": "marketing-sales",
  "financial-plan": "financial-plan"
};

function buildWorkspaceTabs(openTaskCount: number): WorkspaceTab[] {
  return [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "executive-summary", label: "Executive Summary", icon: NotebookText, sectionId: "executive-summary" },
    { id: "company-overview", label: "Company Overview", icon: Building2, sectionId: "company-overview" },
    { id: "business-description", label: "Business Description", icon: FileText, sectionId: "business-description" },
    { id: "market-analysis", label: "Market Analysis", icon: ChartColumnIncreasing, sectionId: "market-analysis" },
    { id: "operating-plan", label: "Operating Plan", icon: ClipboardCheck, sectionId: "operating-plan" },
    { id: "marketing-sales", label: "Marketing & Sales Plan", icon: TrendingUp, sectionId: "marketing-sales" },
    { id: "financial-plan", label: "Financial Plan", icon: Gauge, sectionId: "financial-plan" },
    { id: "appendix", label: "Appendix", icon: FileArchive, dividerBefore: true },
    { id: "documents", label: "Documents", icon: FileChartColumn },
    { id: "tasks", label: "Tasks", icon: ListChecks, count: openTaskCount },
    { id: "notes", label: "Notes", icon: BookOpenCheck },
    { id: "settings", label: "Settings", icon: Settings }
  ];
}

const toneClasses = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  orange: "border-orange-200 bg-orange-50 text-orange-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700"
} satisfies Record<StudioTone, string>;

const toneTextClasses = {
  green: "text-emerald-700",
  blue: "text-[var(--primary)]",
  violet: "text-violet-700",
  orange: "text-orange-700",
  amber: "text-amber-700"
} satisfies Record<StudioTone, string>;

const stageStatusLabel = {
  complete: "Complete",
  active: "Active",
  blocked: "Blocked",
  queued: "Queued"
} satisfies Record<StageStatus, string>;

const tabSubtitle: Partial<Record<WorkspaceTabId, string>> = {
  appendix: "Keep source documents, assumptions, and export evidence close to the final plan.",
  documents: "Review plan files, source workbooks, and export-ready attachments.",
  tasks: "Track the follow-up work needed before the business plan is ready to share.",
  notes: "Capture review notes that should inform the next planning pass.",
  settings: "Control workspace readiness, demo-mode behavior, and export guardrails."
};

function App() {
  const ws = useWorkspace();
  const { sections, stages, tasks: allTasks, planSummary: summary, preferences } = ws;
  const openTaskCount = allTasks.filter((t) => !t.complete).length;
  const workspaceTabs = useMemo(() => buildWorkspaceTabs(openTaskCount), [openTaskCount]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [activeTab, setActiveTab] = useState<WorkspaceTabId>(
    (preferences.lastActiveTab as WorkspaceTabId) || "dashboard"
  );
  const [activeSectionId, setActiveSectionId] = useState<PlanSection["id"]>("financial-plan");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Show onboarding dialog on first run (only if not previously dismissed)
  useEffect(() => {
    if (!ws.loading && ws.isFirstRun && !preferences.onboardingDismissed && !showOnboarding) {
      setShowOnboarding(true);
    }
  }, [ws.loading, ws.isFirstRun, preferences.onboardingDismissed, showOnboarding]);

  const activeTabMeta = workspaceTabs.find((tab) => tab.id === activeTab) ?? workspaceTabs[0];
  const activeSection = useMemo(() => {
    const sectionId = activeTabMeta.sectionId ?? activeSectionId;
    return sections.find((section) => section.id === sectionId) ?? sections[0];
  }, [activeSectionId, activeTabMeta.sectionId, sections]);
  const getStageById = ws.getStageById;
  const activeStage = getStageById(activeSection?.stageId ?? "foundation");

  function handleTabChange(tabId: WorkspaceTabId) {
    const nextTab = workspaceTabs.find((tab) => tab.id === tabId) ?? workspaceTabs[0];
    setActiveTab(nextTab.id);
    if (nextTab.sectionId) {
      setActiveSectionId(nextTab.sectionId);
    }
    setIsMobileNavOpen(false);
    ws.updatePreferences({ lastActiveTab: tabId });
  }

  function openSection(sectionId: PlanSection["id"]) {
    const tab = workspaceTabs.find((item) => item.sectionId === sectionId);
    setActiveSectionId(sectionId);
    if (tab) {
      setActiveTab(tab.id);
    }
  }

  function openStage(stageId: BusinessStage["id"]) {
    const stage = getStageById(stageId);
    if (stage.sectionId) {
      openSection(stage.sectionId);
    }
  }

  const pageTitle = activeTab === "dashboard" ? summary.title : activeTabMeta.label;
  const pageSubtitle =
    activeTab === "dashboard" ? summary.subtitle : activeTabMeta.sectionId ? activeSection?.description ?? "" : tabSubtitle[activeTab] ?? summary.subtitle;

  if (ws.loading) {
    return (
      <div className="min-h-dvh bg-[var(--background)] flex items-center justify-center">
        <div className="text-center fade-in">
          <div className="brand-mark mx-auto mb-4" style={{ width: 64, height: 64, color: "var(--primary)" }}>
            <svg viewBox="0 0 48 48" role="img">
              <path d="M24 3 42 13.5v21L24 45 6 34.5v-21L24 3Z" fill="none" stroke="currentColor" strokeWidth="3" />
              <path d="M14 30.5V17.5L24 11.5l10 6v13l-10 6-10-6Z" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.7" />
              <path d="M28.8 16.8 19.2 24l9.6 7.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
            </svg>
          </div>
          <p style={{ color: "var(--muted-foreground)", fontWeight: 700 }}>Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <Sidebar activeTab={activeTab} onSelect={handleTabChange} tabs={workspaceTabs} />
      <MobileHeader onOpenMenu={() => setIsMobileNavOpen(true)} />
      <MobileNavigation activeTab={activeTab} isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} onSelect={handleTabChange} tabs={workspaceTabs} />
      {showOnboarding && <OnboardingDialog onClose={() => { setShowOnboarding(false); ws.updatePreferences({ onboardingDismissed: true }); }} />}

      <main className="workbench-main">
        <Topbar title={pageTitle} subtitle={pageSubtitle} />

        <section
          id={`panel-${activeTab}`}
          className="tab-panel"
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          tabIndex={0}
        >
          {activeTab === "dashboard" ? (
            <FounderStudioView onOpenSection={openSection} onOpenStage={openStage} onOpenTab={handleTabChange} />
          ) : activeTabMeta.sectionId ? (
            <SectionWorkspace section={activeSection} stage={activeStage} onBackToDashboard={() => handleTabChange("dashboard")} />
          ) : activeTab === "appendix" ? (
            <AppendixWorkspace />
          ) : activeTab === "documents" ? (
            <DocumentsWorkspace />
          ) : activeTab === "tasks" ? (
            <TasksWorkspace />
          ) : activeTab === "notes" ? (
            <NotesWorkspace />
          ) : (
            <SettingsWorkspace />
          )}
        </section>
      </main>
    </div>
  );
}

function Topbar({ title, subtitle }: { title: string; subtitle: string }) {
  const ws = useWorkspace();
  const { planSummary: summary, activity, updateProfile } = ws;
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleExport = async () => {
    try {
      await downloadBusinessPlanPdf({
        planSummary: summary,
        sections: ws.sections,
        stages: ws.stages,
        blockers: ws.blockers,
        evidence: ws.evidence,
        checkpoints: ws.checkpoints,
        metrics: ws.metrics,
        revenue: ws.revenue,
        tasks: ws.tasks,
        documents: ws.documents,
        notes: ws.notes
      });
      toast.success("PDF exported", { description: "Your business plan has been downloaded as PDF." });
    } catch {
      toast.error("Export failed", { description: "Could not generate the PDF. Please try again." });
    }
  };

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { type: string; label: string; icon: LucideIcon; action: () => void }[] = [];
    for (const section of ws.sections) {
      if (section.title.toLowerCase().includes(q) || section.description.toLowerCase().includes(q)) {
        results.push({ type: "Section", label: section.title, icon: FileText, action: () => { setSearchOpen(false); setSearchQuery(""); } });
      }
    }
    for (const task of ws.tasks) {
      if (task.label.toLowerCase().includes(q)) {
        results.push({ type: "Task", label: task.label, icon: ListChecks, action: () => { setSearchOpen(false); setSearchQuery(""); } });
      }
    }
    for (const doc of ws.documents) {
      if (doc.name.toLowerCase().includes(q)) {
        results.push({ type: "Document", label: doc.name, icon: FileChartColumn, action: () => { setSearchOpen(false); setSearchQuery(""); } });
      }
    }
    return results.slice(0, 8);
  }, [searchQuery, ws.sections, ws.tasks, ws.documents]);

  return (
    <header className="topbar">
      <div className="title-block">
        <span className="eyebrow">Guided business builder</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="topbar-cluster">
        <div className="topbar-actions" aria-label="Workspace controls">
          <Button variant="ghost" size="icon" aria-label="Search business plan" onClick={() => setSearchOpen(true)}>
            <Search />
          </Button>
          <DropdownMenu
            trigger={
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <span className="notification-wrap">
                  <Bell />
                  {activity.length > 0 && <span className="notification-count">{activity.length}</span>}
                </span>
              </Button>
            }
          >
            <div className="p-3 min-w-[260px]">
              <p className="text-xs font-extrabold text-[var(--muted-foreground)] mb-2">Recent Activity</p>
              {activity.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-start gap-2 py-2">
                  <span className={cn("activity-dot mt-1.5", `activity-dot-${item.tone}`)} />
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-[var(--foreground)] m-0">
                      {item.actor} {item.action} {item.target}
                    </p>
                    <span className="text-[11px] text-[var(--muted-foreground)]">{item.timestamp}</span>
                  </div>
                </div>
              ))}
              {activity.length === 0 && <p className="text-[13px] text-[var(--muted-foreground)]">No recent activity</p>}
            </div>
          </DropdownMenu>
          <DropdownMenu
            trigger={
              <button type="button" className="profile-chip" aria-label={`${summary.profileName}, ${summary.profileRole}`}>
                <Avatar name={summary.profileName} size="md" />
                <div className="profile-copy">
                  <p>{summary.profileName}</p>
                  <span>{summary.profileRole}</span>
                </div>
                <ChevronDown className="size-4 text-[var(--muted-foreground)]" />
              </button>
            }
          >
            <div className="p-3 min-w-[240px]">
              <p className="text-sm font-extrabold mb-1">{summary.profileName}</p>
              <p className="text-xs text-[var(--muted-foreground)] mb-3">{summary.profileRole}</p>
              <Separator className="mb-3" />
              <DropdownItem onClick={() => toast.info("Profile editing is available in Settings")}>
                <User className="size-4" /> Edit Profile
              </DropdownItem>
              <DropdownItem onClick={() => toast.info("Navigate to Settings for workspace configuration")}>
                <Settings className="size-4" /> Settings
              </DropdownItem>
            </div>
          </DropdownMenu>
        </div>

        <div className="save-row">
          <p>Last saved: {summary.lastSaved}</p>
          <Button onClick={handleExport}>
            Export PDF
            <FileText />
          </Button>
        </div>
      </div>

      <Dialog open={searchOpen} onClose={() => { setSearchOpen(false); setSearchQuery(""); }}>
        <div>
          <input
            className="command-input"
            placeholder="Search sections, tasks, documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <div className="command-list">
            {filteredResults.length === 0 && searchQuery.trim() ? (
              <div className="command-empty">No results found for &ldquo;{searchQuery}&rdquo;</div>
            ) : filteredResults.length === 0 ? (
              <div className="command-empty">Start typing to search...</div>
            ) : (
              filteredResults.map((result, i) => (
                <button key={i} type="button" className="command-item" onClick={result.action}>
                  <span className="command-item-icon"><result.icon className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[13px] font-bold">{result.label}</p>
                    <span className="text-[11px] text-[var(--muted-foreground)]">{result.type}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Dialog>
    </header>
  );
}

function Sidebar({ activeTab, onSelect, tabs }: { activeTab: WorkspaceTabId; onSelect: (tabId: WorkspaceTabId) => void; tabs: WorkspaceTab[] }) {
  return (
    <aside className="sidebar" aria-label="Kancatura navigation">
      <BrandLockup />
      <NavigationItems activeTab={activeTab} onSelect={onSelect} tabs={tabs} />
      <ProTip onSelect={onSelect} />
    </aside>
  );
}

function BrandLockup() {
  const ws = useWorkspace();
  return (
    <div className="brand-lockup">
      <KancaturaMark />
      <div className="brand-wordmark" aria-label="Kancatura Business Plan">
        <p>{ws.planSummary.brand}</p>
        <span>{ws.planSummary.brandSuffix}</span>
      </div>
    </div>
  );
}

function KancaturaMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 48 48" role="img">
        <path d="M24 3 42 13.5v21L24 45 6 34.5v-21L24 3Z" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M14 30.5V17.5L24 11.5l10 6v13l-10 6-10-6Z" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.7" />
        <path d="M28.8 16.8 19.2 24l9.6 7.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
      </svg>
    </div>
  );
}

function NavigationItems({
  activeTab,
  onSelect,
  tabs,
  hidden = false
}: {
  activeTab: WorkspaceTabId;
  onSelect: (tabId: WorkspaceTabId) => void;
  tabs: WorkspaceTab[];
  hidden?: boolean;
}) {
  return (
    <nav className="nav-list" role="tablist" aria-orientation="vertical" aria-label="Business plan tabs">
      {tabs.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === activeTab;
        return (
          <div key={item.id} className={cn(item.dividerBefore && "nav-divider")}>
            <button
              id={`tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${item.id}`}
              className={cn("nav-link", isActive && "nav-link-active")}
              onClick={() => onSelect(item.id)}
              tabIndex={hidden ? -1 : 0}
            >
              <Icon className="size-5 shrink-0" />
              <span>{item.label}</span>
              {item.count ? <span className="nav-count">{item.count}</span> : null}
            </button>
          </div>
        );
      })}
    </nav>
  );
}

function ProTip({ onSelect }: { onSelect: (tabId: WorkspaceTabId) => void }) {
  const ws = useWorkspace();
  if (ws.preferences.proTipDismissed) return null;
  return (
    <div className="pro-tip">
      <Target className="size-8 text-amber-300" />
      <div>
        <p>Builder Focus</p>
        <span>Start with the stage that blocks export readiness, then attach evidence before polishing copy.</span>
        <button type="button" onClick={() => onSelect("dashboard")}>Review stages -&gt;</button>
        <button
          type="button"
          className="block mt-2 text-[11px] text-white/50 hover:text-white/80 transition-colors"
          onClick={() => ws.updatePreferences({ proTipDismissed: true })}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function MobileHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="mobile-header">
      <BrandLockup />
      <Button variant="secondary" size="icon" aria-label="Open navigation" onClick={onOpenMenu}>
        <Menu />
      </Button>
    </header>
  );
}

function MobileNavigation({
  activeTab,
  isOpen,
  onClose,
  onSelect,
  tabs
}: {
  activeTab: WorkspaceTabId;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tabId: WorkspaceTabId) => void;
  tabs: WorkspaceTab[];
}) {
  return (
    <div className={cn("mobile-nav-shell", isOpen && "mobile-nav-shell-open")} aria-hidden={!isOpen}>
      <button className="mobile-nav-backdrop" type="button" aria-label="Close navigation" onClick={onClose} tabIndex={isOpen ? 0 : -1} />
      <aside className="mobile-nav-panel" aria-label="Mobile Kancatura navigation">
        <BrandLockup />
        <NavigationItems activeTab={activeTab} onSelect={onSelect} hidden={!isOpen} tabs={tabs} />
      </aside>
    </div>
  );
}

function FounderStudioView({
  onOpenSection,
  onOpenStage,
  onOpenTab
}: {
  onOpenSection: (sectionId: PlanSection["id"]) => void;
  onOpenStage: (stageId: BusinessStage["id"]) => void;
  onOpenTab: (tabId: WorkspaceTabId) => void;
}) {
  const ws = useWorkspace();
  const { stages, blockers, evidence, checkpoints, activity, signals, highlights, metrics, revenue, tasks, documents, planSummary: summary, getStageById } = ws;
  const currentStage = getStageById(summary.currentStageId);
  const CurrentStageIcon = currentStage.icon;
  const currentSection = ws.sections.find((section) => section.id === currentStage.sectionId) ?? ws.sections[0];
  const currentBlockers = blockers.filter((blocker) => blocker.stageId === currentStage.id && !blocker.resolved);
  const openTasks = tasks.filter((task) => !task.complete);

  return (
    <div className="studio-shell fade-in">
      <section className="studio-grid" aria-label="Founder Studio overview">
        <div className="build-lane" aria-labelledby="build-business-heading">
          <div className="build-lane-copy">
            <Badge variant="warning">Current phase {currentStage.phase}</Badge>
            <h2 id="build-business-heading">Build Your Business</h2>
            <p>{currentStage.description}</p>
          </div>

          <div className="current-stage-panel">
            <div className="stage-panel-header">
              <span className={cn("stage-icon", toneClasses[currentStage.tone])}>
                <CurrentStageIcon className="size-6" />
              </span>
              <div>
                <span className="micro-label">Now working on</span>
                <h3>{currentStage.title}</h3>
              </div>
              <StageStatusBadge status={currentStage.status} />
            </div>

            <div className="next-action-callout">
              <span>Next action</span>
              <p>{currentStage.nextAction}</p>
            </div>

            <div className="blocker-stack" aria-label="Readiness blockers">
              {currentBlockers.map((blocker) => (
                <BlockerRow key={blocker.id} blocker={blocker} />
              ))}
            </div>

            <div className="stage-panel-footer">
              <div className="readiness-inline">
                <span>{currentStage.readiness}% ready</span>
                <Progress value={currentStage.readiness} />
              </div>
              <Button onClick={() => onOpenSection(currentSection.id)}>
                Work on {currentSection.title}
                <ArrowRight />
              </Button>
            </div>
          </div>

          <section className="signal-grid" aria-label="Founder Studio readiness signals">
            {signals.map((signal) => (
              <StudioSignalCard key={signal.label} signal={signal} />
            ))}
          </section>
        </div>

        <aside className="studio-side" aria-label="Studio review panels">
          <section className="quiet-panel export-panel">
            <PanelTitle icon={FileCheck2} title="Export Path" />
            <div className="checkpoint-list">
              {checkpoints.map((checkpoint) => (
                <CheckpointRow key={checkpoint.id} checkpoint={checkpoint} />
              ))}
            </div>
          </section>

          <section className="quiet-panel">
            <PanelTitle icon={Activity} title="Studio Activity" />
            <div className="activity-list">
              {activity.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="stage-map" aria-label="Guided builder stages">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Builder stages</span>
            <h2>Move from idea to export-ready plan</h2>
          </div>
          <Button variant="outline" onClick={() => onOpenTab("tasks")}>
            Review Tasks
            <ListChecks />
          </Button>
        </div>
        <div className="stage-track">
          {stages.map((stage) => (
            <StageCard key={stage.id} stage={stage} onOpenStage={onOpenStage} />
          ))}
        </div>
      </section>

      <section className="studio-support-grid" aria-label="Supporting workspace panels">
        <section className="quiet-panel evidence-panel">
          <PanelTitle icon={Layers3} title="Evidence Coverage" />
          {evidence.map((item) => (
            <EvidenceRow key={item.id} item={item} />
          ))}
        </section>

        <section className="quiet-panel">
          <PanelTitle icon={Sparkles} title="Plan Promise" />
          <div className="highlight-list">
            {highlights.map((highlight) => (
              <HighlightRow key={highlight.title} highlight={highlight} />
            ))}
          </div>
        </section>

        <section className="quiet-panel">
          <PanelTitle icon={ListChecks} title="Open Work" />
          <div className="divide-y divide-[var(--border)]">
            {openTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </section>

        <section className="quiet-panel">
          <PanelTitle icon={FileChartColumn} title="Recent Documents" />
          <div className="divide-y divide-[var(--border)]">
            {documents.slice(0, 3).map((document) => (
              <DocumentRow key={document.id} document={document} />
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenTab("documents")}>
            View document library
            <ArrowRight />
          </Button>
        </section>
      </section>

      <section className="financial-lens" aria-label="Financial readiness">
        <div>
          <span className="eyebrow">Financial lens</span>
          <h2>Revenue shape stays visible, without crowding the builder.</h2>
        </div>
        <div className="financial-grid">
          <div className="metric-list">
            {metrics.map((metric) => (
              <MetricRow key={metric.label} metric={metric} />
            ))}
          </div>
          <RevenueChart />
        </div>
      </section>

      <section className="capability-strip" aria-label="Kancatura operating principles">
        {capabilityStrip.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="capability-item">
              <span className={cn("capability-icon", toneClasses[item.tone])}>
                <Icon className="size-6" />
              </span>
              <div>
                <p className={cn("font-extrabold", toneTextClasses[item.tone])}>{item.title}</p>
                <span>{item.body}</span>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function SectionWorkspace({
  section,
  stage,
  onBackToDashboard
}: {
  section: PlanSection;
  stage: BusinessStage;
  onBackToDashboard: () => void;
}) {
  const ws = useWorkspace();
  const stageBlockers = ws.blockers.filter((blocker) => blocker.stageId === stage.id && !blocker.resolved);
  const stageEvidence = ws.evidence.filter((item) => item.stageId === stage.id);
  const stageTasks = ws.tasks.filter((task) => task.stageId === stage.id);
  const stageDocuments = ws.documents.filter((document) => document.stageId === stage.id);
  const StageIcon = stage.icon;

  return (
    <div className="workspace-panel fade-in">
      <section className="workspace-hero">
        <div>
          <div className="hero-badge-row">
            <Badge variant={section.risk === "High" ? "warning" : section.risk === "Medium" ? "violet" : "success"}>{section.risk} Risk</Badge>
            <StageStatusBadge status={stage.status} />
          </div>
          <h2>{section.title}</h2>
          <p>{section.description}</p>
        </div>
        <Button variant="outline" onClick={onBackToDashboard}>
          Back to Founder Studio
        </Button>
      </section>

      <section className="workspace-stat-grid" aria-label={`${section.title} readiness`}>
        {sectionWorkspaceStats.map((stat) => (
          <div key={stat.label} className="workspace-stat">
            <span>{stat.label}</span>
            <strong>{stat.label === "Export readiness" ? `${section.completion}%` : stat.value}</strong>
          </div>
        ))}
      </section>

      <section className="section-studio-grid">
        <article className="section-focus-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Stage {stage.phase}</span>
              <h2>{stage.title}</h2>
            </div>
            <span className={cn("stage-icon", toneClasses[stage.tone])}>
              <StageIcon className="size-6" />
            </span>
          </div>

          <div className="next-action-callout">
            <span>Drafting focus</span>
            <p>{section.nextAction}</p>
          </div>

          <div className="prompt-grid">
            {section.notes.map((note) => (
              <div key={note} className="note-row">
                <Sparkles className="size-4 shrink-0 text-[var(--primary)]" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </article>

        <aside className="readiness-sidebar">
          <div className="readiness-box">
            <div>
              <span>Stage readiness</span>
              <strong>{stage.readiness}%</strong>
            </div>
            <Progress value={stage.readiness} />
            <dl>
              <div>
                <dt>Owner</dt>
                <dd>{stage.owner}</dd>
              </div>
              <div>
                <dt>Evidence</dt>
                <dd>{section.evidence}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{section.updatedAt}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </section>

      <section className="studio-support-grid" aria-label={`${stage.title} linked work`}>
        <section className="quiet-panel">
          <PanelTitle icon={AlertTriangle} title="Blockers" />
          {stageBlockers.length ? stageBlockers.map((blocker) => <BlockerRow key={blocker.id} blocker={blocker} />) : (
            <div className="empty-state">
              <CheckCircle2 className="size-8" />
              <p>No blockers for this stage. Keep up the momentum!</p>
            </div>
          )}
        </section>
        <section className="quiet-panel">
          <PanelTitle icon={Layers3} title="Evidence" />
          {stageEvidence.map((item) => (
            <EvidenceRow key={item.id} item={item} />
          ))}
        </section>
        <div className="current-stage-panel">
          <PanelTitle icon={ListChecks} title="Linked Work" />
          <div className="divide-y divide-[var(--border)]">
            {stageTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
            {stageDocuments.map((document) => (
              <DocumentRow key={document.id} document={document} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function AppendixWorkspace() {
  return (
    <div className="workspace-panel fade-in">
      <section className="workspace-grid">
        {appendixItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="xl:col-span-3">
              <CardHeader>
                <span className="appendix-icon">
                  <Icon className="size-5" />
                </span>
              </CardHeader>
              <CardContent>
                <h2 className="workspace-card-title">{item.title}</h2>
                <p className="workspace-card-copy">{item.body}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}

function DocumentsWorkspace() {
  const ws = useWorkspace();
  return (
    <div className="workspace-panel fade-in">
      <section className="workspace-toolbar">
        <div>
          <h2>Document Library</h2>
          <p>All plan documents remain visible before export, with every file tied back to a builder stage.</p>
        </div>
        <Button onClick={() => toast.info("Document import coming soon")}>
          <Plus />
          Import Document
        </Button>
      </section>
      <Card>
        <CardContent className="divide-y divide-[var(--border)] p-0">
          {ws.documents.map((document) => (
            <DocumentRow key={document.id} document={document} expanded />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function TasksWorkspace() {
  const ws = useWorkspace();
  const [showAddTask, setShowAddTask] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newDue, setNewDue] = useState("");

  const completedTasks = ws.tasks.filter((task) => task.complete);
  const openTasks = ws.tasks.filter((task) => !task.complete);

  const handleAddTask = async () => {
    if (!newLabel.trim()) return;
    await ws.addTask({
      stageId: "foundation",
      label: newLabel.trim(),
      due: newDue || "TBD",
      complete: false,
      owner: newOwner || "Unassigned"
    });
    toast.success("Task created", { description: `"${newLabel}" added to your task list.` });
    setNewLabel("");
    setNewOwner("");
    setNewDue("");
    setShowAddTask(false);
  };

  return (
    <div className="workspace-panel fade-in">
      <section className="workspace-toolbar" style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2>Task Board</h2>
          <p>Track the follow-up work needed before the business plan is ready to share.</p>
        </div>
        <Button onClick={() => setShowAddTask(true)}>
          <Plus />
          Add Task
        </Button>
      </section>

      <section className="task-board">
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
            <Badge variant="success">{completedTasks.length}</Badge>
          </CardHeader>
          <CardContent className="divide-y divide-[var(--border)] p-0">
            {completedTasks.length === 0 && (
              <div className="empty-state">
                <Clock3 className="size-8" />
                <p>No completed tasks yet.</p>
              </div>
            )}
            {completedTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
            <Badge variant="warning">{openTasks.length}</Badge>
          </CardHeader>
          <CardContent className="divide-y divide-[var(--border)] p-0">
            {openTasks.length === 0 && (
              <div className="empty-state">
                <CheckCircle2 className="size-8 text-[var(--accent-green)]" />
                <p>All tasks are complete!</p>
              </div>
            )}
            {openTasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </CardContent>
        </Card>
      </section>

      <Dialog open={showAddTask} onClose={() => setShowAddTask(false)}>
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>Create a follow-up task linked to the business plan.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 mt-4">
          <div className="settings-field">
            <label>Task label</label>
            <Input placeholder="e.g. Review pricing assumptions" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
          </div>
          <div className="settings-field">
            <label>Owner</label>
            <Input placeholder="e.g. Finance" value={newOwner} onChange={(e) => setNewOwner(e.target.value)} />
          </div>
          <div className="settings-field">
            <label>Due date</label>
            <Input placeholder="e.g. Jun 15" value={newDue} onChange={(e) => setNewDue(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
          <Button onClick={handleAddTask}>Create Task</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function NotesWorkspace() {
  const ws = useWorkspace();
  return (
    <div className="workspace-panel fade-in">
      <section className="workspace-grid">
        {ws.notes.map((note) => (
          <Card key={note.title} className="xl:col-span-4">
            <CardHeader>
              <div>
                <CardTitle>{note.title}</CardTitle>
                <CardDescription>{note.updatedAt}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="workspace-card-copy">{note.body}</p>
            </CardContent>
          </Card>
        ))}
        {ws.notes.length === 0 && (
          <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
            <NotebookText className="size-10" />
            <p>No notes yet. Add review notes from the section workspace.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function SettingsWorkspace() {
  const ws = useWorkspace();
  const { preferences, planSummary: summary } = ws;
  const [profileName, setProfileName] = useState(summary.profileName);
  const [profileRole, setProfileRole] = useState(summary.profileRole);
  const [market, setMarket] = useState(summary.market);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = async () => {
    await ws.updateProfile({ profileName, profileRole, market });
    toast.success("Profile saved", { description: "Your workspace profile has been updated." });
  };

  const handleResetData = async () => {
    await ws.resetData();
    toast.success("Data reset", { description: "All workspace data has been restored to defaults." });
  };

  const handleExportData = async () => {
    const json = await ws.exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kancatura-workspace-export.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported", { description: "Your workspace data has been downloaded as JSON." });
  };

  const handleExportPdf = async () => {
    try {
      await downloadBusinessPlanPdf({
        planSummary: summary,
        sections: ws.sections,
        stages: ws.stages,
        blockers: ws.blockers,
        evidence: ws.evidence,
        checkpoints: ws.checkpoints,
        metrics: ws.metrics,
        revenue: ws.revenue,
        tasks: ws.tasks,
        documents: ws.documents,
        notes: ws.notes
      });
      toast.success("PDF exported", { description: "Your business plan has been downloaded as PDF." });
    } catch {
      toast.error("Export failed", { description: "Could not generate the PDF. Please try again." });
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_IMPORT_BYTES) {
      toast.error("Import failed", { description: "File is too large. Maximum size is 10 MB." });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const text = await file.text();
    try {
      await ws.importData(text);
      toast.success("Data imported", { description: "Your workspace data has been restored from the file." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "The file could not be parsed.";
      toast.error("Import failed", { description: message });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="workspace-panel fade-in">
      <section className="settings-card-grid">
        <Card>
          <CardHeader>
            <CardTitle>Workspace Mode</CardTitle>
            <Badge variant={isLocalFirst ? "violet" : "success"}>{isLocalFirst ? "Local Workspace" : "Connected"}</Badge>
          </CardHeader>
          <CardContent>
            <p className="workspace-card-copy">
              Your data is stored locally in this browser using IndexedDB. No server connection required. Export your data regularly to keep a backup.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <Button size="sm" onClick={handleSaveProfile}><Save className="size-3.5" /> Save</Button>
          </CardHeader>
          <CardContent>
            <div className="settings-field">
              <label>Workspace name</label>
              <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} />
            </div>
            <div className="settings-field">
              <label>Role</label>
              <Input value={profileRole} onChange={(e) => setProfileRole(e.target.value)} />
            </div>
            <div className="settings-field">
              <label>Market</label>
              <Input value={market} onChange={(e) => setMarket(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Guardrails</CardTitle>
            <Badge variant="neutral">Configurable</Badge>
          </CardHeader>
          <CardContent>
            <div className="settings-guardrail-list">
              <div className="settings-guardrail-item">
                <span>Require stage readiness before export</span>
                <Switch
                  checked={preferences.exportGuardrails.requireStageReadiness}
                  onChange={(v) => ws.updatePreferences({ exportGuardrails: { ...preferences.exportGuardrails, requireStageReadiness: v } })}
                />
              </div>
              <div className="settings-guardrail-item">
                <span>Preserve POPIA compliance language</span>
                <Switch
                  checked={preferences.exportGuardrails.preservePOPIA}
                  onChange={(v) => ws.updatePreferences({ exportGuardrails: { ...preferences.exportGuardrails, preservePOPIA: v } })}
                />
              </div>
              <div className="settings-guardrail-item">
                <span>Show blockers in review flow</span>
                <Switch
                  checked={preferences.exportGuardrails.showBlockersInReview}
                  onChange={(v) => ws.updatePreferences({ exportGuardrails: { ...preferences.exportGuardrails, showBlockersInReview: v } })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <Badge variant="neutral">Local</Badge>
          </CardHeader>
          <CardContent>
            <p className="workspace-card-copy mb-3">
              Export your business plan as a professional PDF, export workspace data as JSON, or restore from a previous backup.
            </p>
            <div className="settings-action-row">
              <Button variant="outline" size="sm" onClick={handleExportPdf}>
                <FileText className="size-3.5" /> Export PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="size-3.5" /> Export JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-3.5" /> Import JSON
              </Button>
              <input ref={fileInputRef} type="file" accept=".json" hidden onChange={handleImportData} />
              <Button variant="outline" size="sm" onClick={handleResetData}>
                <Database className="size-3.5" /> Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <Badge variant="neutral">Theme</Badge>
          </CardHeader>
          <CardContent>
            <div className="settings-guardrail-list">
              <div className="settings-guardrail-item">
                <span>Dark mode (coming soon)</span>
                <Switch
                  checked={preferences.theme === "dark"}
                  onChange={(v) => ws.updatePreferences({ theme: v ? "dark" : "light" })}
                  disabled
                />
              </div>
              <div className="settings-guardrail-item">
                <span>Compact sidebar</span>
                <Switch
                  checked={preferences.sidebarDensity === "compact"}
                  onChange={(v) => ws.updatePreferences({ sidebarDensity: v ? "compact" : "comfortable" })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <Badge variant="neutral">v{appVersion}</Badge>
          </CardHeader>
          <CardContent>
            <p className="workspace-card-copy">
              Kancatura is a local-first business plan workspace. Your data never leaves your browser. 
              Export your data regularly to keep safe backups.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StageCard({ stage, onOpenStage }: { stage: BusinessStage; onOpenStage: (stageId: BusinessStage["id"]) => void }) {
  const ws = useWorkspace();
  const blockers = ws.blockers.filter((blocker) => blocker.stageId === stage.id && !blocker.resolved);
  const Icon = stage.icon;

  return (
    <button type="button" className={cn("stage-card", `stage-card-${stage.status}`)} onClick={() => onOpenStage(stage.id)}>
      <div className="stage-card-header">
        <span className="stage-phase">{stage.phase}</span>
        <span className={cn("stage-icon", toneClasses[stage.tone])}>
          <Icon className="size-5" />
        </span>
      </div>
      <div className="stage-card-copy">
        <strong>{stage.title}</strong>
        <span>{stage.nextAction}</span>
      </div>
      <div className="stage-card-footer">
        <span>{stage.readiness}%</span>
        <span>{blockers.length ? `${blockers.length} blockers` : "clear"}</span>
      </div>
    </button>
  );
}

function StudioSignalCard({ signal }: { signal: StudioSignal }) {
  return (
    <article className="signal-card">
      <span className={cn("signal-dot", `signal-dot-${signal.tone}`)} />
      <div className="min-w-0 flex-1">
        <p>{signal.label}</p>
        <strong>{signal.value}</strong>
        <span>{signal.detail}</span>
      </div>
    </article>
  );
}

function BlockerRow({ blocker }: { blocker: ReadinessBlocker & { resolved?: boolean } }) {
  const ws = useWorkspace();
  return (
    <article className={cn("blocker-row", `severity-${blocker.severity.toLowerCase()}`)}>
      <AlertTriangle className="size-4 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p>{blocker.label}</p>
        <span>{blocker.action}</span>
      </div>
      <Badge variant={blocker.severity === "High" ? "warning" : "neutral"} className="shrink-0 self-start">{blocker.owner}</Badge>
    </article>
  );
}

function EvidenceRow({ item }: { item: EvidenceItem }) {
  const badgeVariant = item.status === "verified" ? "success" : item.status === "needed" ? "warning" : item.status === "review" ? "violet" : "neutral";

  return (
    <article className="evidence-row">
      <span className="evidence-icon shrink-0 mt-0.5">
        <FileCheck2 className="size-4 shrink-0" />
      </span>
      <div className="min-w-0 flex-1">
        <p>{item.title}</p>
        <span>{item.detail}</span>
      </div>
      <Badge variant={badgeVariant} className="shrink-0 self-start">{item.status}</Badge>
    </article>
  );
}

function CheckpointRow({ checkpoint }: { checkpoint: ExportCheckpoint }) {
  const Icon = checkpoint.status === "ready" ? CheckCircle2 : checkpoint.status === "blocked" ? AlertTriangle : Clock3;
  const badgeVariant = checkpoint.status === "ready" ? "success" : checkpoint.status === "blocked" ? "warning" : "violet";

  return (
    <article className="checkpoint-row">
      <Icon className="size-4 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p>{checkpoint.label}</p>
        <span>{checkpoint.detail}</span>
      </div>
      <Badge variant={badgeVariant} className="shrink-0 self-start">{checkpoint.status}</Badge>
    </article>
  );
}

function ActivityRow({ item }: { item: StudioActivity }) {
  return (
    <article className="activity-row">
      <span className={cn("activity-dot", `activity-dot-${item.tone}`)} />
      <div className="min-w-0 flex-1">
        <p>
          <strong>{item.actor}</strong> {item.action} {item.target}
        </p>
        <time>{item.timestamp}</time>
      </div>
    </article>
  );
}

function PanelTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="panel-title">
      <Icon className="size-4 shrink-0" />
      <h2>{title}</h2>
    </div>
  );
}

function StageStatusBadge({ status }: { status: StageStatus }) {
  const variant = status === "complete" ? "success" : status === "blocked" ? "warning" : status === "active" ? "violet" : "neutral";
  return <Badge variant={variant}>{stageStatusLabel[status]}</Badge>;
}

function MetricRow({ metric }: { metric: FinancialMetric }) {
  return (
    <article className="metric-row">
      <div>
        <p>{metric.label}</p>
        <strong>{metric.value}</strong>
        <span>{metric.delta}</span>
      </div>
      <MiniTrend data={metric.trend} tone={metric.tone} />
      <TrendBadge metric={metric} />
    </article>
  );
}

function TrendBadge({ metric }: { metric: FinancialMetric }) {
  const showsPercent = metric.status.includes("%");
  return (
    <span className={cn("trend-badge", `trend-badge-${metric.tone}`)}>
      {showsPercent ? <TrendingUp className="size-3" /> : null}
      {metric.status}
    </span>
  );
}

function MiniTrend({ data, tone }: { data: number[]; tone: FinancialMetric["tone"] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1, max - min);
  const points = data
    .map((value, index) => {
      const x = data.length === 1 ? 65 : (index / (data.length - 1)) * 130;
      const y = 43 - ((value - min) / range) * 34;
      return `${x},${y}`;
    })
    .join(" ");
  const stroke = tone === "green" ? "#0f9f5f" : tone === "amber" ? "#f59e0b" : tone === "violet" ? "#6d4df2" : "#145ee6";

  return (
    <svg className="mini-trend" viewBox="0 0 130 48" aria-hidden="true">
      <polygon points={`0,46 ${points} 130,46`} fill={`${stroke}12`} />
      <polyline points={points} fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
    </svg>
  );
}

function RevenueChart() {
  const ws = useWorkspace();
  const revenueData = ws.revenue;
  const maxRevenue = Math.max(1, ...revenueData.flatMap((quarter) => [quarter.yearOne, quarter.yearTwo, quarter.yearThree]));
  const maxMargin = Math.max(1, ...revenueData.map((quarter) => quarter.margin));
  const marginPoints = revenueData
    .map((quarter, index) => {
      const x = 86 + index * 122;
      const y = 202 - (quarter.margin / maxMargin) * 142;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="chart-wrap">
      <div className="chart-legend">
        <span><i className="bg-[var(--primary)]" />Year 1</span>
        <span><i className="bg-[var(--accent-green)]" />Year 2</span>
        <span><i className="bg-[var(--accent-violet)]" />Year 3</span>
        <span><i className="bg-[var(--accent-orange)]" />EBITDA Margin</span>
      </div>
      <svg viewBox="0 0 640 260" className="revenue-chart" role="img" aria-label="Revenue projection chart">
        {[0, 1, 2, 3, 4].map((line) => {
          const y = 48 + line * 42;
          const label = ["10M", "7.5M", "5M", "2.5M", "0"][line];
          const rightLabel = ["20%", "15%", "10%", "5%", "0%"][line];
          return (
            <g key={line}>
              <text x="14" y={y + 4} className="chart-axis-label">{label}</text>
              <line x1="56" x2="548" y1={y} y2={y} stroke="#dce4ef" strokeWidth="1" />
              <text x="606" y={y + 4} textAnchor="end" className="chart-axis-label">{rightLabel}</text>
            </g>
          );
        })}
        {revenueData.map((quarter, index) => {
          const baseX = 78 + index * 122;
          const bars = [
            { value: quarter.yearOne, color: "var(--primary)" },
            { value: quarter.yearTwo, color: "var(--accent-green)" },
            { value: quarter.yearThree, color: "var(--accent-violet)" }
          ];

          return (
            <g key={quarter.quarter}>
              {bars.map((bar, barIndex) => {
                const height = (bar.value / maxRevenue) * 148;
                return (
                  <rect
                    key={`${quarter.quarter}-${bar.color}`}
                    x={baseX + barIndex * 22}
                    y={216 - height}
                    width="17"
                    height={height}
                    rx="3"
                    fill={bar.color}
                  />
                );
              })}
              <text x={baseX + 23} y="246" textAnchor="middle" className="chart-axis-label">
                {quarter.quarter}
              </text>
            </g>
          );
        })}
        <polyline points={marginPoints} fill="none" stroke="var(--accent-orange)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        {marginPoints.split(" ").map((point) => {
          const [cx, cy] = point.split(",");
          return <circle key={point} cx={cx} cy={cy} r="4" fill="var(--accent-orange)" />;
        })}
      </svg>
    </div>
  );
}

function TaskRow({ task, compact = false }: { task: PlanTask; compact?: boolean }) {
  const ws = useWorkspace();
  const stage = ws.getStageById(task.stageId);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await ws.toggleTask(task.id);
    toast(task.complete ? "Task reopened" : "Task completed", {
      description: task.label
    });
  };

  return (
    <article className="task-row">
      <button type="button" className={cn("task-check", task.complete && "task-check-done")} onClick={handleToggle} aria-label={task.complete ? "Mark as incomplete" : "Mark as complete"}>
        {task.complete ? <Check className="size-3.5" /> : <Circle className="size-3.5" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-extrabold text-[var(--foreground)] m-0">{task.label}</p>
        {!compact ? <span className="truncate block text-[12px] font-medium text-slate-500 mt-1">{stage.title} - {task.owner}</span> : null}
      </div>
      <time className="shrink-0 text-[11px] font-semibold text-slate-400 whitespace-nowrap ml-2">{task.due}</time>
      <button
        type="button"
        className="shrink-0 ml-1 rounded p-1 text-slate-400 hover:text-red-500 transition-colors"
        aria-label={`Delete task: ${task.label}`}
        onClick={async (e) => {
          e.stopPropagation();
          await ws.removeTask(task.id);
          toast("Task deleted", { description: task.label });
        }}
      >
        <X className="size-3.5" />
      </button>
    </article>
  );
}

function DocumentRow({ document, expanded = false }: { document: PlanDocument; expanded?: boolean }) {
  const ws = useWorkspace();
  const stage = ws.getStageById(document.stageId);
  const tone =
    document.kind === "DOCX"
      ? "document-blue"
      : document.kind === "XLSX"
        ? "document-green"
        : document.kind === "PDF"
          ? "document-red"
          : "document-orange";

  return (
    <article className={cn("document-row", expanded && "document-row-expanded")}>
      <span className={cn("document-icon", tone)}>
        <FileText className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-extrabold text-[var(--foreground)] m-0">{document.name}</p>
        <span className="truncate block text-[12px] font-medium text-slate-500 mt-1">{document.kind} - {stage.title}</span>
      </div>
      <div className="flex flex-col items-end shrink-0 gap-1.5 ml-2">
        <time className="text-[11px] font-semibold text-slate-400 whitespace-nowrap block">{document.updatedAt}</time>
        {expanded ? <Badge variant="neutral" className="text-[10px] px-1.5 py-0 h-4">{document.status}</Badge> : null}
      </div>
      <DropdownMenu
        trigger={
          <Button variant="ghost" size="icon" aria-label={`Open actions for ${document.name}`} className="shrink-0 size-7">
            <MoreVertical className="size-4" />
          </Button>
        }
      >
        <DropdownItem onClick={() => toast.info(`Opening ${document.name}`)}>Open</DropdownItem>
        <DropdownItem onClick={() => toast.info(`Downloading ${document.name}`)}>Download</DropdownItem>
        <DropdownSeparator />
        <DropdownItem onClick={() => toast.info(`Sharing ${document.name}`)}>Share</DropdownItem>
      </DropdownMenu>
    </article>
  );
}

function HighlightRow({ highlight }: { highlight: Highlight }) {
  const Icon = highlight.icon;

  return (
    <article className="highlight-row">
      <span className={cn("highlight-icon", toneClasses[highlight.tone])}>
        <Icon className="size-5" />
      </span>
      <div>
        <h3>{highlight.title}</h3>
        <p>{highlight.body}</p>
      </div>
    </article>
  );
}

export default App;

// ── Onboarding Dialog ────────────────────────────────────────────

function OnboardingDialog({ onClose }: { onClose: () => void }) {
  const ws = useWorkspace();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [market, setMarket] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const handleGetStarted = async () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    const profileName = name.trim() || "My Business Plan";
    const profileRole = role.trim() || "Founder";
    const marketValue = market.trim() || "Define your target market";
    await ws.completeOnboarding({ profileName, profileRole, market: marketValue });
    ws.updatePreferences({ onboardingDismissed: true });
    toast.success("Welcome!", { description: "Your workspace is ready. Start by filling out the Foundation stage." });
    onClose();
  };

  return (
    <Dialog open onClose={onClose}>
      <div className="onboarding-content">
        <div className="onboarding-header">
          <KancaturaMark />
          <div>
            <h2 className="text-xl font-extrabold m-0">Welcome to Kancatura</h2>
            <p className="text-sm text-[var(--muted-foreground)] m-0 mt-1">
              Your local-first business plan workspace
            </p>
          </div>
        </div>

        {step === 1 ? (
          <div className="onboarding-body">
            <div className="onboarding-feature">
              <Shield className="size-5 text-[var(--accent-green)] shrink-0" />
              <div>
                <p className="font-bold text-sm m-0">Your data stays private</p>
                <span className="text-xs text-[var(--muted-foreground)]">All data is stored locally in your browser. Nothing is sent to any server.</span>
              </div>
            </div>
            <div className="onboarding-feature">
              <Layers3 className="size-5 text-[var(--primary)] shrink-0" />
              <div>
                <p className="font-bold text-sm m-0">Guided builder stages</p>
                <span className="text-xs text-[var(--muted-foreground)]">Move from Foundation through Export with structured stages and checklists.</span>
              </div>
            </div>
            <div className="onboarding-feature">
              <Download className="size-5 text-[var(--accent-violet)] shrink-0" />
              <div>
                <p className="font-bold text-sm m-0">Export when ready</p>
                <span className="text-xs text-[var(--muted-foreground)]">Generate your business plan document when all stages are complete.</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="onboarding-body">
            <p className="text-sm text-[var(--muted-foreground)] mb-3">Tell us about your business to personalize the workspace.</p>
            <div className="settings-field">
              <label>Business or project name</label>
              <Input placeholder="e.g. My Startup" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div className="settings-field">
              <label>Your role</label>
              <Input placeholder="e.g. Founder, CEO, Consultant" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <div className="settings-field">
              <label>Target market</label>
              <Input placeholder="e.g. South African retail SMBs" value={market} onChange={(e) => setMarket(e.target.value)} />
            </div>
          </div>
        )}

        <div className="onboarding-footer">
          {step === 2 && (
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
              Back
            </Button>
          )}
          <div className="flex-1" />
          {step === 1 && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Skip for now
            </Button>
          )}
          <Button onClick={handleGetStarted}>
            {step === 1 ? "Get Started" : "Start Building"}
            <ArrowRight />
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
