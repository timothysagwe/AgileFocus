import { writable, derived } from 'svelte/store';
import { StateEngine, buildInitialState } from '../engines/state-engine.js';
import { getScenario } from '../engines/scenario-engine.js';
import { WorkdayEngine } from '../engines/workday-engine.js';

const STORAGE_KEY = 'af2_state';

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function createStore() {
  const persisted = loadPersisted();
  const se = new StateEngine(persisted);
  const { subscribe, set, update } = writable(se.snapshot);

  let wde = null;
  let currentScenario = null;

  subscribe(s => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  });

  function save() {
    set(se.snapshot);
  }

  function loadScenario(scenarioId) {
    const scenario = getScenario(scenarioId);
    if (!scenario) return;
    currentScenario = scenario;
    const fresh = buildInitialState();
    fresh.scenario_id = scenarioId;
    fresh.trust_scores = { ...scenario.initial_trust };
    fresh.blockers = [];
    fresh.inbox = [];
    fresh.active_decisions = [];
    fresh.pending_messages = [];
    fresh.event_log = [];
    Object.assign(se.state, fresh);
    wde = new WorkdayEngine(se, scenario);
    save();
  }

  function startWorkday() {
    if (!wde) return;
    se.state.day += 1;
    save();
    wde.start();
    const interval = setInterval(() => {
      if (!wde || !wde.running) {
        clearInterval(interval);
        return;
      }
      save();
    }, 500);
  }

  function respondToMessage(msgId, response) {
    if (wde) wde.respondToMessage(msgId, response);
    save();
  }

  function delayMessage(msgId) {
    if (wde) wde.delayMessage(msgId);
    save();
  }

  function ignoreMessage(msgId) {
    if (wde) wde.ignoreMessage(msgId);
    save();
  }

  function resolveBlocker(blockerId) {
    if (wde) wde.resolveBlocker(blockerId);
    save();
  }

  function makeDecision(decisionId) {
    if (wde) wde.makeDecision(decisionId);
    save();
  }

  function pause() {
    if (wde) wde.pause();
    save();
  }

  function resume() {
    if (wde) wde.resume();
    save();
  }

  function stop() {
    if (wde) wde.stop();
    save();
  }

  function reset() {
    const fresh = buildInitialState();
    Object.assign(se.state, fresh);
    wde = null;
    currentScenario = null;
    save();
  }

  return {
    subscribe,
    loadScenario,
    startWorkday,
    respondToMessage,
    delayMessage,
    ignoreMessage,
    resolveBlocker,
    makeDecision,
    pause,
    resume,
    stop,
    reset,
    getEngine: () => wde
  };
}

export const sim = createStore();

export const inbox = derived(sim, $s => $s.inbox?.filter(m => m.status === 'pending') || []);
export const decisions = derived(sim, $s => $s.active_decisions || []);
export const blockers = derived(sim, $s => $s.blockers?.filter(b => !b.resolved) || []);
export const eventLog = derived(sim, $s => $s.event_log?.slice(-20) || []);
export const trustScores = derived(sim, $s => $s.trust_scores || {});
export const timeline = derived(sim, $s => $s.timeline || { hour: 9, minute: 0, day: 0, sprint: 1 });
