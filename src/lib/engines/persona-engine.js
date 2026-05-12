const PERSONALITIES = {
  'sarah-chen': {
    id: 'sarah-chen',
    name: 'Sarah Chen',
    role: 'Product Owner',
    avatar: 'SC',
    pressure_threshold: 70,
    escalation_triggers: ['ignored', 'delayed'],
    interests: ['scope', 'deadlines', 'stakeholder'],
    communication: 'direct'
  },
  'james-oliver': {
    id: 'james-oliver',
    name: 'James Oliver',
    role: 'Risk Manager',
    avatar: 'JO',
    pressure_threshold: 50,
    escalation_triggers: ['compliance_breach', 'missed_deadline'],
    interests: ['risk', 'compliance', 'documentation'],
    communication: 'formal'
  },
  'priya-sharma': {
    id: 'priya-sharma',
    name: 'Priya Sharma',
    role: 'Internal Auditor',
    avatar: 'PS',
    pressure_threshold: 40,
    escalation_triggers: ['missing_evidence', 'governance_gap'],
    interests: ['audit', 'evidence', 'traceability'],
    communication: 'probing'
  },
  'marcus-thompson': {
    id: 'marcus-thompson',
    name: 'Marcus Thompson',
    role: 'Tech Lead',
    avatar: 'MT',
    pressure_threshold: 80,
    escalation_triggers: ['blocker', 'scope_creep'],
    interests: ['technical', 'architecture', 'quality'],
    communication: 'blunt'
  },
  'emma-foster': {
    id: 'emma-foster',
    name: 'Emma Foster',
    role: 'FCA Supervisor',
    avatar: 'EF',
    pressure_threshold: 30,
    escalation_triggers: ['regulatory_breach', 'reporting_failure'],
    interests: ['regulation', 'reporting', 'deadlines'],
    communication: 'authoritative'
  },
  'david-oyekan': {
    id: 'david-oyekan',
    name: 'David Oyekan',
    role: 'Senior Manager',
    avatar: 'DO',
    pressure_threshold: 60,
    escalation_triggers: ['budget', 'timeline', 'escalation'],
    interests: ['budget', 'strategy', 'governance'],
    communication: 'diplomatic'
  }
};

export function getPersona(id) {
  return PERSONALITIES[id] ? { ...PERSONALITIES[id] } : null;
}

export function getAllPersonas() {
  return Object.keys(PERSONALITIES).map(k => ({ ...PERSONALITIES[k] }));
}

export function getPersonasForRole(role) {
  if (role === 'pm') return ['sarah-chen', 'james-oliver', 'priya-sharma', 'marcus-thompson', 'emma-foster'];
  if (role === 'ba') return ['sarah-chen', 'james-oliver', 'priya-sharma', 'marcus-thompson', 'david-oyekan'];
  return Object.keys(PERSONALITIES);
}

export function generatePressureResponse(personaId, trustScore, action, stateEngine) {
  const persona = PERSONALITIES[personaId];
  if (!persona) return null;

  const trustLevel = trustScore ?? 50;
  const pressure = 100 - trustLevel;

  if (pressure < persona.pressure_threshold) return null;

  const messages = {
    'sarah-chen': {
      ignored: "I'm not getting responses on this. Need to escalate to get movement.",
      delayed: "You said you'd handle this. When can I expect an update?"
    },
    'james-oliver': {
      ignored: "This is a risk issue. If it's not addressed I'll need to flag it to the senior team.",
      delayed: "The risk register needs updating. This can't wait."
    },
    'priya-sharma': {
      ignored: "I note the lack of response. This will be reflected in my audit findings.",
      delayed: "Evidence deadlines are not optional. I need this today."
    },
    'marcus-thompson': {
      ignored: "This blocker is stopping my team. I need a decision or I'm redirecting work.",
      delayed: "We're burning hours waiting on this. Make a call."
    },
    'emma-foster': {
      ignored: "Non-response to regulatory requests is itself a compliance matter.",
      delayed: "This reporting deadline is regulatory. I expect immediate attention."
    },
    'david-oyekan': {
      ignored: "I'm hearing concerns from the team. Need a sitrep.",
      delayed: "This needs to be resolved. What support do you need?"
    }
  };

  return messages[personaId]?.[action] || null;
}
