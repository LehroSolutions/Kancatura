// ── User preferences stored in localStorage ──────────────────────

const STORAGE_KEY = "kancatura-preferences";

export interface UserPreferences {
  workspaceName: string;
  workspaceRole: string;
  theme: "light" | "dark";
  sidebarDensity: "comfortable" | "compact";
  proTipDismissed: boolean;
  onboardingDismissed: boolean;
  exportGuardrails: {
    requireStageReadiness: boolean;
    preservePOPIA: boolean;
    showBlockersInReview: boolean;
  };
  lastActiveTab: string;
}

const defaultPreferences: UserPreferences = {
  workspaceName: "Kancatura Workspace",
  workspaceRole: "Business Plan",
  theme: "light",
  sidebarDensity: "comfortable",
  proTipDismissed: false,
  onboardingDismissed: false,
  exportGuardrails: {
    requireStageReadiness: true,
    preservePOPIA: true,
    showBlockersInReview: true
  },
  lastActiveTab: "dashboard"
};

export function getPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultPreferences };
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      ...defaultPreferences,
      ...parsed,
      exportGuardrails: {
        ...defaultPreferences.exportGuardrails,
        ...(parsed.exportGuardrails ?? {})
      }
    };
  } catch {
    return { ...defaultPreferences };
  }
}

export function setPreferences(updates: Partial<UserPreferences>): UserPreferences {
  const current = getPreferences();
  const next: UserPreferences = {
    ...current,
    ...updates,
    exportGuardrails: {
      ...current.exportGuardrails,
      ...(updates.exportGuardrails ?? {})
    }
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("kancatura:preferences-change"));
  return next;
}

export function resetPreferences(): UserPreferences {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("kancatura:preferences-change"));
  return { ...defaultPreferences };
}

export function onPreferencesChange(callback: () => void): () => void {
  window.addEventListener("kancatura:preferences-change", callback);
  return () => window.removeEventListener("kancatura:preferences-change", callback);
}
