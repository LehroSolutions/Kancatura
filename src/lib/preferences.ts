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

const MAX_TEXT_LENGTH = 200;

// Untrusted JSON spread: clamp string fields and whitelist enums instead of trusting storage.
function asClampedString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.slice(0, MAX_TEXT_LENGTH) : fallback;
}

export function getPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultPreferences };
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    const theme = parsed.theme === "dark" ? "dark" : "light";
    const density = parsed.sidebarDensity === "compact" ? "compact" : "comfortable";
    return {
      ...defaultPreferences,
      ...parsed,
      workspaceName: asClampedString(parsed.workspaceName, defaultPreferences.workspaceName),
      workspaceRole: asClampedString(parsed.workspaceRole, defaultPreferences.workspaceRole),
      theme,
      sidebarDensity: density,
      lastActiveTab: asClampedString(parsed.lastActiveTab, defaultPreferences.lastActiveTab),
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    // QuotaExceededError and privacy-mode blocks must not kill preference updates.
    console.warn("Kancatura: could not persist preferences to localStorage", err);
  }
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
