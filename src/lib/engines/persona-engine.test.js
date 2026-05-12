import { describe, it, expect } from 'vitest';
import { PersonaEngine } from './persona-engine.js';

const defaultState = {
  budget_variance: 5,
  sprint_velocity_trend: 'stable',
  regulatory_pressure: 'low',
  days_to_governance_milestone: 30,
  sprint_number: 1,
  active_blockers: [],
  evidence_pack_status: 'none',
  change_freeze_active: false,
  backlog_size: 20,
  team_capacity_percentage: 85
};

const mockPersona = {
  id: 'test-persona',
  name: 'Test Persona',
  role: 'Tester',
  organisation_type: 'consultancy',
  agenda: 'Test things',
  communication_style: 'formal_data_driven',
  knowledge_boundary: { misunderstands: 'nothing', triggers_on: 'nothing' },
  trust_score_initial: 50,
  triggers: [
    { condition: 'budget_variance > 10', response_key: 'budget_overrun', trust_delta: -10, cascade_state_change: { regulatory_pressure: 'elevated' } },
    { condition: 'evidence_pack_status == none', response_key: 'missing_evidence', trust_delta: -8 },
    { condition: 'regulatory_pressure == critical', response_key: 'critical_pressure', trust_delta: -15 },
    { condition: 'active_blockers.length > 3', response_key: 'too_many_blockers', trust_delta: -5 },
    { condition: 'change_freeze_active == true', response_key: 'freeze_active', trust_delta: -3 },
    { condition: 'sprint_velocity_trend != stable', response_key: 'velocity_changed', trust_delta: -7 },
    { condition: 'backlog_size >= 20', response_key: 'backlog_large', trust_delta: -2 }
  ],
  conflict_with: ['Adversary'],
  responses: {
    budget_overrun: 'Budget is over 10%',
    missing_evidence: 'Evidence pack is missing',
    critical_pressure: 'Critical pressure!',
    too_many_blockers: 'Too many blockers',
    freeze_active: 'Freeze is active',
    velocity_changed: 'Velocity changed',
    backlog_large: 'Backlog is large',
    fallback: 'Fallback response'
  },
  byok_system_prompt: 'You are a test persona.'
};

function makeEngine(stateOverrides = {}) {
  return new PersonaEngine([mockPersona], { ...defaultState, ...stateOverrides });
}

/* ---------- Constructor ---------- */

describe('constructor', () => {
  it('initialises trust scores from persona data', () => {
    const engine = makeEngine();
    expect(engine.getPersonaTrustScore('test-persona')).toBe(50);
  });

  it('returns null for unknown persona trust score', () => {
    const engine = makeEngine();
    expect(engine.getPersonaTrustScore('nobody')).toBeNull();
  });

  it('stores initial state snapshot', () => {
    const engine = makeEngine({ budget_variance: 99 });
    expect(engine.sessionLog.state_snapshots.length).toBe(1);
    expect(engine.sessionLog.state_snapshots[0].budget_variance).toBe(99);
  });
});

/* ---------- Condition Parser ---------- */

describe('parseCondition', () => {
  const engine = makeEngine();

  it('parses > numeric comparison', () => {
    expect(engine.parseCondition('budget_variance > 3', { budget_variance: 5 })).toBe(true);
    expect(engine.parseCondition('budget_variance > 10', { budget_variance: 5 })).toBe(false);
  });

  it('parses < numeric comparison', () => {
    expect(engine.parseCondition('backlog_size < 30', { backlog_size: 20 })).toBe(true);
    expect(engine.parseCondition('backlog_size < 10', { backlog_size: 20 })).toBe(false);
  });

  it('parses >= numeric comparison', () => {
    expect(engine.parseCondition('backlog_size >= 20', { backlog_size: 20 })).toBe(true);
    expect(engine.parseCondition('backlog_size >= 30', { backlog_size: 20 })).toBe(false);
  });

  it('parses <= numeric comparison', () => {
    expect(engine.parseCondition('backlog_size <= 20', { backlog_size: 20 })).toBe(true);
    expect(engine.parseCondition('backlog_size <= 10', { backlog_size: 20 })).toBe(false);
  });

  it('parses == string comparison', () => {
    expect(engine.parseCondition('regulatory_pressure == low', { regulatory_pressure: 'low' })).toBe(true);
    expect(engine.parseCondition('regulatory_pressure == critical', { regulatory_pressure: 'low' })).toBe(false);
  });

  it('parses != string comparison', () => {
    expect(engine.parseCondition('sprint_velocity_trend != declining', { sprint_velocity_trend: 'stable' })).toBe(true);
    expect(engine.parseCondition('sprint_velocity_trend != stable', { sprint_velocity_trend: 'stable' })).toBe(false);
  });

  it('parses == boolean comparison', () => {
    expect(engine.parseCondition('change_freeze_active == true', { change_freeze_active: true })).toBe(true);
    expect(engine.parseCondition('change_freeze_active == false', { change_freeze_active: true })).toBe(false);
  });

  it('parses array .length comparison', () => {
    expect(engine.parseCondition('active_blockers.length > 2', { active_blockers: [1, 2, 3] })).toBe(true);
    expect(engine.parseCondition('active_blockers.length > 5', { active_blockers: [1, 2, 3] })).toBe(false);
  });

  it('parses AND conditions', () => {
    expect(engine.parseCondition('sprint_number > 1 AND evidence_pack_status != complete', {
      sprint_number: 2, evidence_pack_status: 'draft'
    })).toBe(true);
    expect(engine.parseCondition('sprint_number > 1 AND evidence_pack_status == complete', {
      sprint_number: 2, evidence_pack_status: 'complete'
    })).toBe(true);
  });

  it('throws on unparseable condition', () => {
    expect(() => engine.parseCondition('invalid syntax here', {})).toThrow();
  });
});

/* ---------- Trigger Evaluation ---------- */

describe('evaluateTriggers', () => {
  it('fires triggers when conditions are met', () => {
    const engine = makeEngine({ budget_variance: 15 });
    const events = engine.evaluateTriggers(engine.state);
    const budgetEvent = events.find(e => e.trigger_condition === 'budget_variance > 10');
    expect(budgetEvent).toBeDefined();
    expect(budgetEvent.trust_delta).toBe(-10);
    expect(budgetEvent.response_text).toBe('Budget is over 10%');
  });

  it('does not fire triggers when conditions are not met', () => {
    const engine = makeEngine({ budget_variance: 5 });
    const events = engine.evaluateTriggers(engine.state);
    const budgetEvent = events.find(e => e.trigger_condition === 'budget_variance > 10');
    expect(budgetEvent).toBeUndefined();
  });

  it('returns events sorted by absolute trust delta descending', () => {
    const engine = makeEngine({
      budget_variance: 15,
      evidence_pack_status: 'none',
      active_blockers: [1, 2, 3, 4]
    });
    const events = engine.evaluateTriggers(engine.state);
    for (let i = 1; i < events.length; i++) {
      expect(Math.abs(events[i - 1].trust_delta)).toBeGreaterThanOrEqual(Math.abs(events[i].trust_delta));
    }
  });

  it('assigns severity based on delta magnitude', () => {
    const engine = makeEngine({ budget_variance: 15 });
    const events = engine.evaluateTriggers(engine.state);
    expect(events.some(e => e.severity === 'warning')).toBe(true);
  });
});

/* ---------- Trust Score Management ---------- */

describe('trust score management', () => {
  it('updates trust scores on trigger fire', () => {
    const engine = makeEngine({ budget_variance: 15, evidence_pack_status: 'draft', backlog_size: 5 });
    const before = engine.getPersonaTrustScore('test-persona');
    engine.evaluateTriggers(engine.state);
    const after = engine.getPersonaTrustScore('test-persona');
    expect(after).toBe(before - 10);
  });

  it('clamps trust score to minimum 0', () => {
    const engine = makeEngine({ regulatory_pressure: 'critical', budget_variance: 15, evidence_pack_status: 'none' });
    engine.trustScores['test-persona'] = 5;
    engine.evaluateTriggers(engine.state);
    expect(engine.getPersonaTrustScore('test-persona')).toBeGreaterThanOrEqual(0);
  });

  it('clamps trust score to maximum 100', () => {
    const engine = makeEngine();
    engine.trustScores['test-persona'] = 99;
    const triggerPersona = {
      ...mockPersona,
      triggers: [{ condition: 'budget_variance > 0', response_key: 'budget_overrun', trust_delta: 5 }]
    };
    const eng = new PersonaEngine([triggerPersona], { budget_variance: 5 });
    eng.trustScores['test-persona'] = 99;
    eng.evaluateTriggers(eng.state);
    expect(eng.getPersonaTrustScore('test-persona')).toBeLessThanOrEqual(100);
  });
});

/* ---------- getTrustSummary ---------- */

describe('getTrustSummary', () => {
  it('categorises trust scores correctly', () => {
    const engine = makeEngine();
    engine.trustScores['test-persona'] = 80;
    const summary = engine.getTrustSummary();
    const found = summary.find(s => s.persona_id === 'test-persona');
    expect(found.trust_category).toBe('allied');
  });

  it('marks hostile for scores below 20', () => {
    const engine = makeEngine();
    engine.trustScores['test-persona'] = 10;
    const summary = engine.getTrustSummary();
    const found = summary.find(s => s.persona_id === 'test-persona');
    expect(found.trust_category).toBe('hostile');
  });

  it('marks resistant for scores between 20 and 40', () => {
    const engine = makeEngine();
    engine.trustScores['test-persona'] = 30;
    const summary = engine.getTrustSummary();
    const found = summary.find(s => s.persona_id === 'test-persona');
    expect(found.trust_category).toBe('resistant');
  });
});

/* ---------- Cascade State Changes ---------- */

describe('cascade state changes', () => {
  it('applies cascade state changes from triggers', () => {
    const engine = makeEngine({ budget_variance: 15 });
    engine.evaluateTriggers(engine.state);
    expect(engine.state.regulatory_pressure).toBe('elevated');
  });

  it('records cascade changes in triggered events', () => {
    const engine = makeEngine({ budget_variance: 15 });
    const events = engine.evaluateTriggers(engine.state);
    const cascadeEvent = events.find(e => e.cascade_changes);
    expect(cascadeEvent).toBeDefined();
    expect(cascadeEvent.cascade_changes.regulatory_pressure).toBe('elevated');
  });
});

/* ---------- updateState ---------- */

describe('updateState', () => {
  it('merges partial state and triggers evaluation', () => {
    const engine = makeEngine();
    const events = engine.updateState({ budget_variance: 15 });
    expect(engine.state.budget_variance).toBe(15);
    expect(events.length).toBeGreaterThan(0);
  });

  it('records state snapshots on update', () => {
    const engine = makeEngine();
    const beforeLength = engine.sessionLog.state_snapshots.length;
    engine.updateState({ budget_variance: 42 });
    expect(engine.sessionLog.state_snapshots.length).toBeGreaterThan(beforeLength);
  });
});

/* ---------- Conflict Detection ---------- */

describe('generateConflictEvent', () => {
  it('detects conflict between personas with matching conflict_with roles', () => {
    const adversary = {
      id: 'adversary',
      name: 'Adversary',
      role: 'Adversary',
      communication_style: 'formal_data_driven',
      agenda: 'Oppose everything',
      knowledge_boundary: { misunderstands: '', triggers_on: '' },
      trust_score_initial: 50,
      triggers: [],
      conflict_with: [],
      responses: { fallback: 'No' },
      byok_system_prompt: ''
    };
    const engine = new PersonaEngine([mockPersona, adversary], defaultState);
    const conflict = engine.generateConflictEvent('test-persona', 'adversary');
    expect(conflict).not.toBeNull();
    expect(conflict.persona_a.id).toBe('test-persona');
    expect(conflict.persona_b.id).toBe('adversary');
  });

  it('returns null when no conflict exists', () => {
    const neutral = {
      id: 'neutral', name: 'Neutral', role: 'Neutral',
      communication_style: 'formal_data_driven', agenda: 'Be neutral',
      knowledge_boundary: { misunderstands: '', triggers_on: '' },
      trust_score_initial: 50, triggers: [], conflict_with: [],
      responses: { fallback: 'OK' }, byok_system_prompt: ''
    };
    const engine = new PersonaEngine([mockPersona, neutral], defaultState);
    const conflict = engine.generateConflictEvent('test-persona', 'neutral');
    expect(conflict).toBeNull();
  });

  it('applies trust penalties on conflict', () => {
    const adversary = {
      id: 'adv', name: 'Adversary', role: 'Adversary',
      communication_style: 'formal_data_driven', agenda: 'Oppose',
      knowledge_boundary: { misunderstands: '', triggers_on: '' },
      trust_score_initial: 50, triggers: [], conflict_with: [],
      responses: { fallback: 'No' }, byok_system_prompt: ''
    };
    const engine = new PersonaEngine([mockPersona, adversary], defaultState);
    const beforeA = engine.getPersonaTrustScore('test-persona');
    const beforeB = engine.getPersonaTrustScore('adv');
    engine.generateConflictEvent('test-persona', 'adv');
    expect(engine.getPersonaTrustScore('test-persona')).toBe(beforeA - 5);
    expect(engine.getPersonaTrustScore('adv')).toBe(beforeB - 5);
  });
});

/* ---------- Response Generation ---------- */

describe('getPersonaResponse', () => {
  it('returns pre-scripted response when no BYOK client', () => {
    const engine = makeEngine();
    const response = engine.getPersonaResponse('test-persona', 'budget_overrun');
    expect(response).toBe('Budget is over 10%');
  });

  it('returns fallback response for unknown context', () => {
    const engine = makeEngine();
    const response = engine.getPersonaResponse('test-persona', 'unknown_situation');
    expect(response).toBe('Fallback response');
  });

  it('returns empty string for unknown persona', () => {
    const engine = makeEngine();
    const response = engine.getPersonaResponse('nobody', 'test');
    expect(response).toBe('');
  });
});

/* ---------- Session Log Export ---------- */

describe('exportSessionLog', () => {
  it('returns structured log with all sections', () => {
    const engine = makeEngine();
    engine.updateState({ budget_variance: 15 });
    const log = engine.exportSessionLog();
    expect(log).toHaveProperty('state_snapshots');
    expect(log).toHaveProperty('triggered_events');
    expect(log).toHaveProperty('trust_history');
    expect(log).toHaveProperty('conflict_events');
    expect(log).toHaveProperty('session_duration_ms');
    expect(typeof log.session_duration_ms).toBe('number');
  });
});

/* ---------- Edge Cases ---------- */

describe('edge cases', () => {
  it('handles empty persona array', () => {
    const engine = new PersonaEngine([], defaultState);
    expect(engine.getTrustSummary()).toEqual([]);
    expect(engine.getPersonaTrustScore('test')).toBeNull();
  });

  it('handles personas with no triggers', () => {
    const noTrigger = {
      id: 'quiet', name: 'Quiet', role: 'Quiet',
      communication_style: 'formal_data_driven', agenda: '',
      knowledge_boundary: { misunderstands: '', triggers_on: '' },
      trust_score_initial: 50, responses: { fallback: 'OK' }, byok_system_prompt: ''
    };
    const engine = new PersonaEngine([noTrigger], defaultState);
    const events = engine.evaluateTriggers(engine.state);
    expect(events).toEqual([]);
  });
});
