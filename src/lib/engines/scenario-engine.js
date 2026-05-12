import { buildInitialState } from './state-engine.js';

export function getScenario(id) {
  const scenarios = {
    'meridian-fraud': buildMeridianScenario()
  };
  return scenarios[id] ? JSON.parse(JSON.stringify(scenarios[id])) : null;
}

export function getAllScenarios() {
  return [
    {
      id: 'meridian-fraud',
      title: 'Meridian Bank — Fraud Alert Triage',
      description: 'A challenger bank needs to implement a real-time fraud alert triage system. Navigate scope pressure, audit deadlines, and regulatory scrutiny.',
      role: 'pm',
      difficulty: 'intermediate',
      estimatedDays: 3
    }
  ];
}

function buildMeridianScenario() {
  return {
    id: 'meridian-fraud',
    title: 'Meridian Bank — Fraud Alert Triage System',
    initial_state: buildInitialState(),
    personas: ['sarah-chen', 'james-oliver', 'priya-sharma', 'marcus-thompson', 'emma-foster'],
    initial_trust: {
      'sarah-chen': 65,
      'james-oliver': 55,
      'priya-sharma': 40,
      'marcus-thompson': 70,
      'emma-foster': 45
    },
    events: [
      { time: '09:00', type: 'inbox_load', data: { count: 4 } },
      { time: '09:30', type: 'meeting', data: { type: 'standup', duration: 15 } },
      { time: '10:15', type: 'blocker', data: { from: 'marcus-thompson', subject: 'API rate limiting blocking development' } },
      { time: '11:00', type: 'message', data: { from: 'sarah-chen', urgency: 'high', subject: 'Scope change: regulator added new reporting fields' } },
      { time: '13:00', type: 'message', data: { from: 'priya-sharma', urgency: 'high', subject: 'Audit evidence request: control testing results' } },
      { time: '14:00', type: 'decision', data: { from: 'scenario', subject: 'Prioritise scope change or audit request?' } },
      { time: '15:30', type: 'message', data: { from: 'james-oliver', urgency: 'medium', subject: 'Governance deadline: CAB submission needed by EOD' } },
      { time: '17:00', type: 'artefact_request', data: { type: 'dod', subject: 'Define Definition of Done for fraud alert feature' } },
      { time: '17:30', type: 'day_summary', data: {} }
    ],
    success_conditions: {
      min_trust: { 'priya-sharma': 30, 'emma-foster': 30 },
      max_audit_risk: 60,
      dod_created: true,
      cab_submitted: true
    },
    failure_conditions: {
      max_blockers_active: 3,
      min_team_morale: 20,
      max_regulatory_pressure: 90
    }
  };
}
