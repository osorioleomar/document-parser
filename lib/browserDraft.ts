const STORAGE_KEY = "liteparse-ui:draft:v1";

export type StoredDraft = {
  originalName: string;
  parsedText: string;
  savedAt: string;
};

export function loadDraft(): StoredDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof (parsed as StoredDraft).parsedText !== "string" ||
      typeof (parsed as StoredDraft).originalName !== "string"
    ) {
      return null;
    }
    return parsed as StoredDraft;
  } catch {
    return null;
  }
}

export function saveDraft(draft: StoredDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // quota exceeded or private mode — ignore
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
