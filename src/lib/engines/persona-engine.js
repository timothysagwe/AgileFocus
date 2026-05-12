export class PersonaEngine {
  constructor(personas, initialState) {
    this.personas = personas;
    this.state = { ...initialState };
    this.trustScores = {};

    this.sessionLog = {
      state_snapshots: [{ ...this.state }],
      triggered_events: [],
      trust_history: [],
      conflict_events: [],
      session_start: Date.now()
    };

    for (const p of personas) {
      this.trustScores[p.id] = clamp(p.trust_score_initial ?? 50, 0, 100);
    }
  }

  /* -------------------- Condition Parser -------------------- */

  parseCondition(condition, state) {
    if (!condition || typeof condition !== 'string') {
      throw new Error(`Invalid condition: ${condition}`);
    }

    const trimmed = condition.trim();

    const andMatch = trimmed.match(/^(.+?)\s+AND\s+(.+)$/i);
    if (andMatch) {
      const left = this.parseCondition(andMatch[1].trim(), state);
      const right = this.parseCondition(andMatch[2].trim(), state);
      return left && right;
    }

    const pattern = /^([a-zA-Z_][a-zA-Z0-9_.]*)\s*(>=|<=|!=|==|>|<)\s*(.+)$/;
    const match = trimmed.match(pattern);

    if (!match) {
      throw new Error(`Unparseable condition: "${condition}"`);
    }

    const [, path, operator, rawValue] = match;
    const actualValue = resolvePath(state, path);
    const expectedValue = parseLiteral(rawValue.trim());

    switch (operator) {
      case '==': return actualValue == expectedValue;
      case '!=': return actualValue != expectedValue;
      case '>': return Number(actualValue) > Number(expectedValue);
      case '<': return Number(actualValue) < Number(expectedValue);
      case '>=': return Number(actualValue) >= Number(expectedValue);
      case '<=': return Number(actualValue) <= Number(expectedValue);
      default: return false;
    }
  }

  /* -------------------- Trigger Evaluation -------------------- */

  evaluateTriggers(updatedState) {
    const events = [];

    for (const persona of this.personas) {
      if (!persona.triggers) continue;

      for (const trigger of persona.triggers) {
        let conditionMet = false;
        try {
          conditionMet = this.parseCondition(trigger.condition, updatedState);
        } catch {
          continue;
        }

        if (!conditionMet) continue;

        const trustBefore = this.trustScores[persona.id] ?? 50;
        const delta = trigger.trust_delta ?? 0;
        const trustAfter = clamp(trustBefore + delta, 0, 100);

        this.trustScores[persona.id] = trustAfter;

        let cascadeChanges = null;
        if (trigger.cascade_state_change) {
          cascadeChanges = { ...trigger.cascade_state_change };
          Object.assign(this.state, cascadeChanges);

          try {
            const nextSnapshot = { ...this.state };
            this.sessionLog.state_snapshots.push(nextSnapshot);
          } catch {}
        }

        const responseText = this.getPreScriptedResponse(persona, trigger.response_key);

        this.sessionLog.trust_history.push({
          persona_id: persona.id,
          timestamp: Date.now(),
          trust_before: trustBefore,
          trust_after: trustAfter,
          reason: trigger.response_key
        });

        const event = {
          persona_id: persona.id,
          persona_name: persona.name,
          persona_role: persona.role,
          trigger_condition: trigger.condition,
          response_text: responseText,
          trust_before: trustBefore,
          trust_after: trustAfter,
          trust_delta: delta,
          cascade_changes: cascadeChanges,
          severity: Math.abs(delta) > 20 ? 'critical' : Math.abs(delta) >= 10 ? 'warning' : 'info',
          timestamp: Date.now()
        };

        events.push(event);
        this.sessionLog.triggered_events.push(event);
      }
    }

    return events.sort((a, b) => Math.abs(b.trust_delta) - Math.abs(a.trust_delta));
  }

  /* -------------------- State Management -------------------- */

  updateState(partialState) {
    Object.assign(this.state, partialState);

    try {
      this.sessionLog.state_snapshots.push({ ...this.state });
    } catch {}

    return this.evaluateTriggers(this.state);
  }

  /* -------------------- Trust Queries -------------------- */

  getPersonaTrustScore(persona_id) {
    if (persona_id in this.trustScores) {
      return this.trustScores[persona_id];
    }
    return null;
  }

  getTrustSummary() {
    return this.personas.map(p => {
      const score = this.trustScores[p.id] ?? 50;
      let trust_category = 'neutral';
      if (score > 70) trust_category = 'allied';
      else if (score < 20) trust_category = 'hostile';
      else if (score < 40) trust_category = 'resistant';

      return {
        persona_id: p.id,
        name: p.name,
        role: p.role,
        trust_score: score,
        trust_category
      };
    });
  }

  /* -------------------- Response Generation -------------------- */

  getPersonaResponse(persona_id, context, byokClient) {
    const persona = this.personas.find(p => p.id === persona_id);
    if (!persona) return '';

    if (byokClient && typeof byokClient === 'function') {
      const stateSummary = JSON.stringify(this.state);
      const prompt = `${persona.byok_system_prompt || ''}\n\nCurrent state: ${stateSummary}\n\nContext: ${context}\n\nRespond as ${persona.name}:`;
      try {
        return byokClient(prompt);
      } catch {
        return this.getFallbackResponse(persona);
      }
    }

    return this.getPreScriptedResponse(persona, context) || this.getFallbackResponse(persona);
  }

  getPreScriptedResponse(persona, key) {
    if (!persona.responses) return '';
    if (key && persona.responses[key]) return persona.responses[key];
    return '';
  }

  getFallbackResponse(persona) {
    if (!persona.responses) return '';
    return persona.responses.fallback || `${persona.name} considers the situation carefully before responding.`;
  }

  /* -------------------- Conflict Detection -------------------- */

  generateConflictEvent(persona_id_a, persona_id_b) {
    const personaA = this.personas.find(p => p.id === persona_id_a);
    const personaB = this.personas.find(p => p.id === persona_id_b);

    if (!personaA || !personaB) return null;

    const hasConflict = (personaA.conflict_with || []).some(c =>
      c === personaB.role || c === personaB.id
    ) || (personaB.conflict_with || []).some(c =>
      c === personaA.role || c === personaA.id
    );

    if (!hasConflict) return null;

    const event = {
      persona_a: { id: personaA.id, name: personaA.name, role: personaA.role },
      persona_b: { id: personaB.id, name: personaB.name, role: personaB.role },
      conflict_description: `${personaA.name} (${personaA.role}) and ${personaB.name} (${personaB.role}) have conflicting agendas: "${personaA.agenda}" vs "${personaB.agenda}".`,
      suggested_resolution: `Facilitate a mediation session focusing on shared risk objectives. Document trade-offs explicitly.`,
      trust_impact: { [personaA.id]: -5, [personaB.id]: -5 }
    };

    this.trustScores[personaA.id] = clamp((this.trustScores[personaA.id] ?? 50) - 5, 0, 100);
    this.trustScores[personaB.id] = clamp((this.trustScores[personaB.id] ?? 50) - 5, 0, 100);
    this.sessionLog.conflict_events.push(event);

    return event;
  }

  /* -------------------- Session Export -------------------- */

  exportSessionLog() {
    return {
      state_snapshots: this.sessionLog.state_snapshots,
      triggered_events: this.sessionLog.triggered_events,
      trust_history: this.sessionLog.trust_history,
      conflict_events: this.sessionLog.conflict_events,
      session_duration_ms: Date.now() - this.sessionLog.session_start
    };
  }
}

/* -------------------- Helpers -------------------- */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolvePath(obj, path) {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    if (part === 'length' && Array.isArray(current)) return current.length;
    current = current[part];
  }
  return current;
}

function parseLiteral(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (value === 'undefined') return undefined;
  const num = Number(value);
  if (!isNaN(num) && value !== '') return num;
  return value;
}
