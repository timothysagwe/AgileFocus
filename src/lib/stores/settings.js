import { writable } from 'svelte/store';

const STORAGE_KEY = 'agilefocus_settings';

const DEFAULT_SETTINGS = {
  byok_key: null,
  byok_active: false,
  theme: 'dark',
  onboarding_complete: false
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch { /* ignore corrupt data */ }
  return { ...DEFAULT_SETTINGS };
}

function createSettingsStore() {
  const { subscribe, set, update } = writable(loadSettings());

  subscribe((state) => {
    try {
      const toStore = { ...state };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch { /* storage full or unavailable */ }
  });

  return {
    subscribe,
    set,
    update,
    reset: () => set({ ...DEFAULT_SETTINGS })
  };
}

export const settings = createSettingsStore();
