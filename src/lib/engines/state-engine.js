export function buildInitialState() {
  return {
    time: '09:00',
    day: 1,
    sprint: 1,
    timeline: { hour: 9, minute: 0, day: 1, sprint: 1 },
    backlog_size: 120,
    velocity: 20,
    budget_variance: 0,
    regulatory_pressure: 30,
    team_morale: 70,
    delivery_health: 75,
    audit_risk: 20,
    active_blockers: [],
    pending_messages: [],
    active_decisions: [],
    trust_scores: {},
    artefacts: {},
    event_log: [],
    scenario_id: null,
    phase: 'intro',
    inbox: [],
    decisions: [],
    completed_tasks: [],
    blockers: []
  };
}

export class StateEngine {
  constructor(state) {
    this.state = state || buildInitialState();
  }

  get snapshot() {
    return { ...this.state };
  }

  update(path, value) {
    const keys = path.split('.');
    let obj = this.state;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
  }

  push(path, item) {
    const keys = path.split('.');
    let obj = this.state;
    for (let i = 0; i < keys.length; i++) obj = obj[keys[i]];
    obj.push(item);
  }

  remove(path, predicate) {
    const keys = path.split('.');
    let obj = this.state;
    for (let i = 0; i < keys.length; i++) obj = obj[keys[i]];
    const idx = obj.findIndex(predicate);
    if (idx > -1) obj.splice(idx, 1);
  }

  updateTrust(personaId, delta) {
    const current = this.state.trust_scores[personaId] ?? 50;
    this.state.trust_scores[personaId] = Math.max(0, Math.min(100, current + delta));
  }

  logEvent(type, data) {
    this.state.event_log.push({
      type,
      time: this.state.time,
      day: this.state.day,
      data,
      timestamp: Date.now()
    });
  }

  getTrustLevel(personaId) {
    const score = this.state.trust_scores[personaId] ?? 50;
    if (score > 70) return 'allied';
    if (score >= 40) return 'neutral';
    if (score >= 20) return 'resistant';
    return 'hostile';
  }
}
