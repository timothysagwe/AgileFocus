import { writable } from 'svelte/store';

const STORAGE_KEY = 'agilefocus_progress';

const DEFAULT_PROGRESS = {
  level: 1,
  completed_exercises: [],
  completed_simulations: [],
  completed_modules: [],
  knowledge_check_scores: {},
  personas_created: [],
  certification_coverage: {}
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
    }
  } catch { /* ignore corrupt data */ }
  return { ...DEFAULT_PROGRESS };
}

function createProgressStore() {
  const { subscribe, set, update } = writable(loadProgress());

  subscribe((state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* storage full or unavailable */ }
  });

  return {
    subscribe,
    set,
    update,
    reset: () => set({ ...DEFAULT_PROGRESS })
  };
}

export const progress = createProgressStore();
