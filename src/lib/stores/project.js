import { writable, derived } from 'svelte/store';
import { LifecycleEngine, buildDefaultProjectState, getPhases, isPhaseUnlocked, getPhaseLabel } from '../engines/lifecycle-engine.js';

const STORAGE_KEY = 'agilefocus_project';

function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...buildDefaultProjectState(), ...parsed };
    }
  } catch { }
  return buildDefaultProjectState();
}

function createProjectStore() {
  const state = loadProject();
  const engine = new LifecycleEngine(state);
  const { subscribe, set, update } = writable(engine.getSnapshot());

  subscribe((val) => {
    try {
      const toStore = { ...val };
      delete toStore.phase_index;
      delete toStore.is_complete;
      delete toStore.total_phases;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch { }
  });

  return {
    subscribe,

    startProject(role) {
      update(() => {
        const eng = new LifecycleEngine(buildDefaultProjectState(role));
        return eng.startProject(role);
      });
    },

    completePhase(phaseId, results, artefacts) {
      update((s) => {
        const eng = new LifecycleEngine(s);
        return eng.completePhase(phaseId, results, artefacts);
      });
    },

    getEngine() {
      let currentState;
      this.subscribe((s) => { currentState = s; })();
      return new LifecycleEngine(currentState);
    },

    getPhaseState(phaseId) {
      let currentState;
      this.subscribe((s) => { currentState = s; })();
      const eng = new LifecycleEngine(currentState);
      return eng.getPhaseState(phaseId);
    },

    reset() {
      const fresh = buildDefaultProjectState();
      const eng = new LifecycleEngine(fresh);
      set(eng.getSnapshot());
    }
  };
}

export const project = createProjectStore();

export const phaseList = derived(project, ($p) => {
  return getPhases().map((phaseId) => {
    const label = getPhaseLabel(phaseId);
    return {
      id: phaseId,
      title: label.title,
      short: label.short,
      icon: label.icon,
      unlocked: isPhaseUnlocked(phaseId, $p),
      completed: $p.completed_phases?.includes(phaseId) || false,
      current: $p.current_phase === phaseId
    };
  });
});

export const nextAction = derived(project, ($p) => {
  if ($p.is_complete) return { type: 'complete', text: 'Project complete — view your portfolio' };
  const phase = getPhaseLabel($p.current_phase);
  return { type: 'continue', text: `Continue: ${phase.title}`, phase: $p.current_phase };
});
