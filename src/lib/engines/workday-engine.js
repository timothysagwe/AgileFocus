import { getPersona, generatePressureResponse } from './persona-engine.js';

const MSG_BANK = {
  'sarah-chen': [
    { urgency: 'high', subject: 'Scope clarification needed on fraud scoring', body: 'The regulator has asked about our fraud scoring methodology. Can we schedule a walkthrough?' },
    { urgency: 'medium', subject: 'Sprint review prep for Thursday', body: 'We need to prepare the sprint review deck. Can you pull together the metrics by EOD?' }
  ],
  'james-oliver': [
    { urgency: 'high', subject: 'Risk register update required', body: 'The fraud alert system introduces new operational risks. The risk register needs updating.' },
    { urgency: 'medium', subject: 'Control testing schedule', body: 'When can we schedule the control testing for the new alert rules?' }
  ],
  'priya-sharma': [
    { urgency: 'high', subject: 'Audit evidence: change control', body: 'I need evidence that all changes to alert rules are going through CAB. Please provide the last 3 CAB minutes.' },
    { urgency: 'medium', subject: 'Traceability matrix review', body: 'The requirements-to-controls traceability matrix needs updating for new fraud scenarios.' }
  ],
  'marcus-thompson': [
    { urgency: 'high', subject: 'Dev environment instability', body: 'The dev environment keeps going down. We\'ve lost half a day already. Need this escalated.' },
    { urgency: 'medium', subject: 'Code review bottleneck', body: 'We\'re waiting on code reviews for the alert engine changes. Can we prioritise these?' }
  ],
  'emma-foster': [
    { urgency: 'high', subject: 'FCA reporting deadline: T+3', body: 'The FCA regulatory return is due in 3 days. I need confirmation that fraud alert metrics are being captured correctly.' },
    { urgency: 'medium', subject: 'Regulatory change: fraud reporting', body: 'The FCA has updated their fraud reporting guidelines. We need to assess impact.' }
  ],
  'david-oyekan': [
    { urgency: 'medium', subject: 'Project status for exec', body: 'The exec team wants a status update on the fraud system. Can you send a brief by tomorrow morning?' },
    { urgency: 'low', subject: 'Budget review next week', body: 'We have a budget review next week. Start pulling together the spend forecast.' }
  ]
};

export class WorkdayEngine {
  constructor(stateEngine, scenario) {
    this.se = stateEngine;
    this.scenario = scenario;
    this.timer = null;
    this.running = false;
    this.interval = 2000;
    this.dayStart = 9;
    this.dayEnd = 18;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.se.state.phase = 'running';
    this.se.logEvent('day_start', { day: this.se.state.timeline.day });
    this.se.state.time = `${String(this.dayStart).padStart(2, '0')}:00`;
    this.se.state.timeline.hour = this.dayStart;
    this.se.state.timeline.minute = 0;
    this.se.state.pending_messages = [];
    this.se.state.inbox = [];
    this.se.state.active_decisions = [];
    this.se.state.active_blockers = [];
    this.tick();
  }

  tick() {
    if (!this.running) return;
    this.advanceTime();
    this.processScheduledEvents();
    this.checkConversations();
    this.applyPressure();
    const t = this.se.state.timeline;
    if (t.hour >= this.dayEnd) {
      this.se.logEvent('day_end', { day: t.day });
      this.se.state.phase = 'paused';
      this.running = false;
      return;
    }
    this.timer = setTimeout(() => this.tick(), this.interval);
  }

  advanceTime() {
    const t = this.se.state.timeline;
    t.minute += 15;
    if (t.minute >= 60) { t.minute = 0; t.hour += 1; }
    this.se.state.time = `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
  }

  processScheduledEvents() {
    if (!this.scenario) return;
    const now = this.se.state.time;
    for (const event of this.scenario.events) {
      if (event.time === now && !event._fired) {
        event._fired = true;
        this.dispatchEvent(event);
      }
    }
  }

  dispatchEvent(event) {
    switch (event.type) {
      case 'inbox_load':
        this.loadInbox(event.data.count);
        break;
      case 'meeting':
        this.se.logEvent('meeting', event.data);
        this.addMessage('system', 'medium', `Meeting: ${event.data.type}`, `Scheduled for ${event.data.duration} minutes.`);
        break;
      case 'blocker':
        this.se.push('blockers', { id: `blocker-${Date.now()}`, from: event.data.from, subject: event.data.subject, time: this.se.state.time, resolved: false });
        this.se.state.team_morale = Math.max(0, this.se.state.team_morale - 5);
        this.se.logEvent('blocker', event.data);
        this.addMessage(event.data.from, 'high', `Blocker: ${event.data.subject}`, event.data.body || event.data.subject);
        break;
      case 'message':
        this.addMessage(event.data.from, event.data.urgency, event.data.subject, event.data.body || event.data.subject);
        break;
      case 'decision':
        this.se.push('active_decisions', { id: `decision-${Date.now()}`, subject: event.data.subject, time: this.se.state.time, status: 'pending', options: event.data.options || [] });
        this.se.logEvent('decision', event.data);
        break;
      case 'artefact_request':
        this.se.push('pending_messages', { id: `artefact-${Date.now()}`, type: 'artefact_request', artefact_type: event.data.type, subject: event.data.subject, time: this.se.state.time, status: 'pending' });
        this.se.logEvent('artefact_request', event.data);
        break;
      case 'day_summary':
        this.se.logEvent('day_summary', {});
        break;
    }
  }

  loadInbox(count) {
    const personaIds = Object.keys(this.se.state.trust_scores);
    for (let i = 0; i < count && i < personaIds.length; i++) {
      const pid = personaIds[i];
      const msgs = MSG_BANK[pid] || MSG_BANK['sarah-chen'];
      const msg = msgs[i % msgs.length];
      this.addMessage(pid, msg.urgency, msg.subject, msg.body);
    }
  }

  addMessage(from, urgency, subject, body) {
    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender_id: from,
      type: urgency === 'high' ? 'escalation' : 'info',
      urgency,
      subject,
      body,
      received_at: this.se.state.time,
      status: 'pending',
      response: null
    };
    this.se.push('inbox', msg);
    this.se.push('pending_messages', msg);
    this.se.logEvent('incoming_message', { from, urgency, subject });
  }

  respondToMessage(msgId, response) {
    const msg = this.se.state.inbox.find(m => m.id === msgId);
    if (!msg) return;
    msg.status = 'responded';
    msg.response = response;
    this.se.state.pending_messages = this.se.state.pending_messages.filter(m => m.id !== msgId);
    this.se.updateTrust(msg.sender_id, 5);
    this.se.logEvent('message_response', { msgId, response });
  }

  delayMessage(msgId) {
    const msg = this.se.state.inbox.find(m => m.id === msgId);
    if (!msg) return;
    msg.status = 'delayed';
    this.se.updateTrust(msg.sender_id, -5);
    this.se.logEvent('message_delayed', { msgId });
    const response = generatePressureResponse(msg.sender_id, this.se.state.trust_scores[msg.sender_id], 'delayed', this.se);
    if (response) this.addMessage(msg.sender_id, 'high', `Follow-up: ${msg.subject}`, response);
  }

  ignoreMessage(msgId) {
    const msg = this.se.state.inbox.find(m => m.id === msgId);
    if (!msg) return;
    msg.status = 'ignored';
    this.se.state.pending_messages = this.se.state.pending_messages.filter(m => m.id !== msgId);
    this.se.updateTrust(msg.sender_id, -10);
    this.se.logEvent('message_ignored', { msgId });
    const response = generatePressureResponse(msg.sender_id, this.se.state.trust_scores[msg.sender_id], 'ignored', this.se);
    if (response) this.addMessage(msg.sender_id, 'high', `Escalation: ${msg.subject}`, response);
  }

  makeDecision(decisionId) {
    const d = this.se.state.active_decisions.find(d => d.id === decisionId);
    if (d) {
      d.status = 'made';
      this.se.state.active_decisions = this.se.state.active_decisions.filter(x => x.id !== decisionId);
      this.se.logEvent('decision_made', { decisionId });
    }
  }

  addBlocker(from, subject) {
    this.se.push('blockers', { id: `blocker-${Date.now()}`, from, subject, time: this.se.state.time, resolved: false });
    this.se.state.team_morale = Math.max(0, this.se.state.team_morale - 8);
    this.se.logEvent('blocker_added', { from, subject });
  }

  resolveBlocker(blockerId) {
    const idx = this.se.state.blockers.findIndex(x => x.id === blockerId);
    if (idx > -1) {
      this.se.state.blockers.splice(idx, 1);
      this.se.state.team_morale = Math.min(100, this.se.state.team_morale + 5);
      this.se.logEvent('blocker_resolved', { blockerId });
    }
  }

  checkConversations() {
    for (const msg of this.se.state.inbox) {
      if (msg.status === 'pending' && this.isStale(msg)) {
        this.ignoreMessage(msg.id);
      }
    }
  }

  isStale(msg) {
    const diff = this.hourDiff(msg.received_at, this.se.state.time);
    return diff >= 2;
  }

  applyPressure() {
    const activeBlockers = this.se.state.blockers.filter(b => !b.resolved).length;
    const staleCount = this.se.state.inbox.filter(m => m.status === 'pending').length;
    this.se.state.regulatory_pressure = Math.min(100, this.se.state.regulatory_pressure + (activeBlockers * 2) + (staleCount > 2 ? 5 : 0));
    this.se.state.delivery_health = Math.max(0, this.se.state.delivery_health - (activeBlockers * 2) - (this.se.state.team_morale < 40 ? 3 : 0));
    this.se.state.audit_risk = Math.min(100, this.se.state.audit_risk + (this.se.state.inbox.filter(m => m.sender_id === 'priya-sharma' && m.status !== 'responded').length * 5));
    this.se.state.budget_variance = this.se.state.budget_variance + (staleCount > 3 ? 1 : 0);
  }

  hourDiff(t1, t2) {
    const [h1, m1] = t1.split(':').map(Number);
    const [h2, m2] = t2.split(':').map(Number);
    return (h2 - h1) + (m2 - m1) / 60;
  }

  pause() {
    this.running = false;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    this.se.state.phase = 'paused';
  }

  resume() {
    if (this.running) return;
    this.running = true;
    this.se.state.phase = 'running';
    this.tick();
  }

  stop() {
    this.pause();
    this.se.state.phase = 'complete';
    this.se.logEvent('simulation_end', {});
  }
}
