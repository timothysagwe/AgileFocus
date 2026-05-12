export class ScenarioRunner {
  constructor(scenario, personaEngine) {
    this.scenario = scenario;
    this.pe = personaEngine;
    this.currentSprintNumber = 0;
    this.sprintHistory = [];
    this.eventLog = [];
    this.decisionsMade = {};
    this.sprintResults = {};
    this.started = false;
    this.completed = false;

    this.projectState = {
      current_sprint: 0,
      dod_choice: null,
      sprint_velocity_trend: 'stable',
      velocity_modifier: 1.0,
      quality_modifier: 1.0,
      regulatory_rigour: 0.5,
      regulatory_pressure: 'normal',
      budget_variance: 0,
      team_capacity_percentage: 100,
      evidence_pack_status: 'none',
      backlog_size: 0,
      total_stories_delivered: 0,
      regulatory_stories_delivered: 0,
      business_stories_delivered: 0,
      sprint_scope_creep: 0,
      change_freeze_active: false,
      change_freeze_days_remaining: 0,
      change_freeze_impact: 'none',
      days_to_governance_milestone: 180,
      dod_disputed: false,
      timeline_breach: false,
      delivery_success: false,
      governance_override: false,
      project_completed: false,
      risk_manager_trust: 50,
      auditor_trust: 40,
      po_trust: 50,
      total_score: 0
    };
  }

  startSprint(sprintNumber) {
    const sprint = this.scenario.sprints.find(s => s.sprint_number === sprintNumber);
    if (!sprint) return null;

    this.currentSprintNumber = sprintNumber;
    this.projectState.current_sprint = sprintNumber;
    this.projectState.days_to_governance_milestone = Math.max(0, 180 - (sprintNumber - 1) * 14);

    this.pe.updateState({
      current_sprint: sprintNumber,
      sprint_number: sprintNumber,
      days_to_governance_milestone: this.projectState.days_to_governance_milestone,
      regulatory_pressure: this.projectState.regulatory_pressure,
      evidence_pack_status: this.projectState.evidence_pack_status,
      backlog_size: sprint.initial_backlog.length,
      change_freeze_active: this.projectState.change_freeze_active,
      dod_choice: this.projectState.dod_choice,
      sprint_velocity_trend: this.projectState.sprint_velocity_trend,
      budget_variance: this.projectState.budget_variance,
      team_capacity_percentage: this.projectState.team_capacity_percentage
    });

    const sprintState = {
      sprint_number: sprintNumber,
      goal: sprint.goal,
      duration_days: sprint.duration_days,
      backlog: [...sprint.initial_backlog],
      decisions: [],
      events: [],
      started: Date.now(),
      day: 0,
      completed: false
    };

    this.sprintHistory[sprintNumber] = sprintState;

    const initialEvents = this.processInjectedEvents(0, sprint);
    sprintState.events.push(...initialEvents);

    this.eventLog.push({
      type: 'sprint_start',
      sprint_number: sprintNumber,
      message: `Sprint ${sprintNumber} started: ${sprint.goal}`,
      timestamp: Date.now()
    });

    return {
      sprint: sprintState,
      availableDecisions: this.getAvailableDecisions(sprint, 0),
      projectState: this.getProjectState(),
      events: initialEvents
    };
  }

  processInjectedEvents(day, sprint) {
    if (!sprint.injected_events) return [];

    const results = [];
    const dayEvents = sprint.injected_events.filter(e => {
      if (e.trigger === 'day') return e.trigger_value === day;
      return false;
    });

    for (const event of dayEvents) {
      const result = this.injectEvent(event, sprint);
      results.push(result);
    }

    return results;
  }

  injectEvent(event, sprint) {
    const result = {
      type: event.event_type,
      payload: event.payload,
      description: event.payload.description || '',
      personaEvents: [],
      timestamp: Date.now()
    };

    switch (event.event_type) {
      case 'backlog_injection': {
        if (event.payload.new_stories) {
          for (const story of event.payload.new_stories) {
            if (this.sprintHistory[this.currentSprintNumber]) {
              this.sprintHistory[this.currentSprintNumber].backlog.push({ ...story, injected: true });
            }
          }
          result.description = event.payload.description;
        }
        if (event.payload.changes) {
          for (const change of event.payload.changes) {
            const sb = this.sprintHistory[this.currentSprintNumber];
            if (sb) {
              const idx = sb.backlog.findIndex(s => s.id === change.story_id);
              if (idx !== -1) {
                sb.backlog[idx].title = change.new_title || sb.backlog[idx].title;
                sb.backlog[idx].points = (sb.backlog[idx].points || 0) + (change.additional_points || 0);
                sb.backlog[idx].modified = true;
              }
            }
          }
          result.description = event.payload.description;
        }
        this.projectState.sprint_scope_creep += event.payload.total_additional_points || 0;
        break;
      }

      case 'persona_trigger': {
        const pState = {};
        if (event.payload.condition_override) {
          pState[event.payload.condition_key] = event.payload.condition_value;
        }
        if (event.payload.cascade_state_change) {
          Object.assign(pState, event.payload.cascade_state_change);
        }
        const personaEvents = this.pe.updateState(pState);
        result.personaEvents = personaEvents;

        if (personaEvents.length > 0) {
          for (const pe of personaEvents) {
            this.eventLog.push({
              type: 'persona_response',
              persona_id: pe.persona_id,
              persona_name: pe.persona_name,
              message: pe.response_text,
              trust_delta: pe.trust_delta,
              trust_before: pe.trust_before,
              trust_after: pe.trust_after,
              severity: pe.severity,
              timestamp: pe.timestamp
            });
            this.updateTrustFromPersona(pe);
          }
        }
        break;
      }

      case 'state_change': {
        if (event.payload.state_changes) {
          Object.assign(this.projectState, event.payload.state_changes);
          this.pe.updateState(event.payload.state_changes);
        }
        result.description = event.payload.description || 'State change occurred';
        this.eventLog.push({
          type: 'state_change',
          message: event.payload.description || 'State change occurred',
          state_changes: event.payload.state_changes,
          timestamp: Date.now()
        });
        break;
      }

      case 'decision': {
        result.description = event.payload.description;
        result.decisionId = event.payload.decision_id;
        break;
      }
    }

    return result;
  }

  getAvailableDecisions(sprint, day) {
    const decisions = [];

    for (const d of sprint.available_decisions || []) {
      if (d.trigger === 'immediate') {
        decisions.push(d);
      } else if (d.trigger === 'day' && d.trigger_value === day) {
        decisions.push(d);
      } else if (d.trigger === 'event') {
        const triggeredEvent = this.eventLog.find(
          e => e.type === 'injected_event' && e.decisionId === d.id
        );
        if (triggeredEvent) {
          decisions.push(d);
        }
      }
    }

    return decisions;
  }

  processDecision(decisionId, choiceId) {
    const sprint = this.scenario.sprints.find(s => s.sprint_number === this.currentSprintNumber);
    if (!sprint) return { success: false, error: 'Sprint not found' };

    const decision = sprint.available_decisions.find(d => d.id === decisionId);
    if (!decision) return { success: false, error: 'Decision not found' };

    const choice = decision.options.find(o => o.id === choiceId);
    if (!choice) return { success: false, error: 'Choice not found' };

    this.decisionsMade[decisionId] = choiceId;

    const stateChanges = choice.state_changes || {};
    Object.assign(this.projectState, stateChanges);
    this.pe.updateState(stateChanges);

    this.eventLog.push({
      type: 'decision',
      decision_id: decisionId,
      decision_title: decision.title,
      choice_id: choiceId,
      choice_label: choice.label,
      message: `Decision: "${decision.title}" → "${choice.label}"`,
      state_changes: stateChanges,
      timestamp: Date.now()
    });

    if (choiceId === 'dod-regulated') {
      this.projectState.regulatory_rigour = 1.5;
    } else if (choiceId === 'dod-standard') {
      this.projectState.regulatory_rigour = 0.5;
    } else if (choiceId === 'dod-minimal') {
      this.projectState.regulatory_rigour = 0.2;
    }

    if (stateChanges.po_trust_modifier) {
      const currentPO = this.projectState.po_trust || 50;
      this.projectState.po_trust = Math.max(0, Math.min(100, currentPO + stateChanges.po_trust_modifier));
      this.pe.updateState({ po_trust: this.projectState.po_trust });
    }
    if (stateChanges.auditor_trust_modifier) {
      const currentAud = this.projectState.auditor_trust || 40;
      this.projectState.auditor_trust = Math.max(0, Math.min(100, currentAud + stateChanges.auditor_trust_modifier));
      this.pe.updateState({ auditor_trust: this.projectState.auditor_trust });
    }

    const trustSnapshot = this.pe.getTrustSummary();
    for (const t of trustSnapshot) {
      if (t.persona_id === 'product-owner-challenger') this.projectState.po_trust = t.trust_score;
      if (t.persona_id === 'risk-manager-tier1') this.projectState.risk_manager_trust = t.trust_score;
      if (t.persona_id === 'internal-auditor') this.projectState.auditor_trust = t.trust_score;
    }

    const triggeredPersonaEvents = this.pe.evaluateTriggers(this.projectState);
    for (const pe of triggeredPersonaEvents) {
      this.eventLog.push({
        type: 'persona_response',
        persona_id: pe.persona_id,
        persona_name: pe.persona_name,
        message: pe.response_text,
        trust_delta: pe.trust_delta,
        trust_before: pe.trust_before,
        trust_after: pe.trust_after,
        severity: pe.severity,
        timestamp: pe.timestamp
      });
      this.updateTrustFromPersona(pe);
    }

    this.projectState.backlog_size = this.sprintHistory[this.currentSprintNumber]
      ? this.sprintHistory[this.currentSprintNumber].backlog.length
      : 0;

    return {
      success: true,
      choice,
      stateChanges,
      personaEvents: triggeredPersonaEvents,
      projectState: this.getProjectState()
    };
  }

  updateTrustFromPersona(pe) {
    if (pe.persona_id === 'product-owner-challenger') this.projectState.po_trust = pe.trust_after;
    if (pe.persona_id === 'risk-manager-tier1') this.projectState.risk_manager_trust = pe.trust_after;
    if (pe.persona_id === 'internal-auditor') this.projectState.auditor_trust = pe.trust_after;
  }

  advanceDay(day) {
    if (!this.sprintHistory[this.currentSprintNumber]) return null;
    this.sprintHistory[this.currentSprintNumber].day = day;

    const sprint = this.scenario.sprints.find(s => s.sprint_number === this.currentSprintNumber);
    if (!sprint) return null;

    const newEvents = this.processInjectedEvents(day, sprint);
    this.sprintHistory[this.currentSprintNumber].events.push(...newEvents);

    const triggeredEvents = [];
    for (const event of newEvents) {
      if (event.personaEvents) {
        triggeredEvents.push(...event.personaEvents);
      }
    }

    const decisions = this.getAvailableDecisions(sprint, day);

    return {
      events: newEvents,
      personaEvents: triggeredEvents,
      decisions
    };
  }

  completeSprint(sprintReviewData) {
    const sprint = this.scenario.sprints.find(s => s.sprint_number === this.currentSprintNumber);
    if (!sprint) return null;

    const rubric = sprint.scoring_rubric;
    let score = 0;
    const results = [];

    for (const criterion of rubric.criteria) {
      const criterionResult = this.evaluateCriterion(criterion, sprintReviewData);
      results.push(criterionResult);
      score += criterionResult.score;
    }

    const maxScore = rubric.max_score;
    const passed = score >= rubric.pass_threshold;
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    const sprintResult = {
      sprint_number: this.currentSprintNumber,
      score,
      maxScore,
      percentage,
      passed,
      criteriaResults: results,
      completed: Date.now()
    };

    this.sprintResults[this.currentSprintNumber] = sprintResult;
    this.projectState.total_score += score;

    this.sprintHistory[this.currentSprintNumber].completed = true;

    this.eventLog.push({
      type: 'sprint_complete',
      sprint_number: this.currentSprintNumber,
      score,
      passed,
      message: `Sprint ${this.currentSprintNumber} complete: ${percentage}% (${score}/${maxScore}) — ${passed ? 'PASSED' : 'BELOW THRESHOLD'}`,
      timestamp: Date.now()
    });

    return sprintResult;
  }

  evaluateCriterion(criterion, sprintReviewData) {
    const id = criterion.id;
    const weight = criterion.weight;
    let score = 0;

    if (id === 'dod_selected') {
      score = this.projectState.dod_choice ? 10 : 0;
    } else if (id === 'backlog_delivered') {
      const storiesDone = sprintReviewData.storiesDelivered || 0;
      const storiesTotal = sprintReviewData.storiesTotal || 1;
      score = Math.round((storiesDone / storiesTotal) * 10);
    } else if (id === 'scope_managed') {
      if (this.projectState.scope_response === 'negotiated') score = 10;
      else if (this.projectState.scope_response === 'rejected') score = 7;
      else if (this.projectState.scope_response === 'accepted') score = 4;
      else score = 5;
    } else if (id === 'regulatory_stories_delivered') {
      const regDone = sprintReviewData.regulatoryStoriesDelivered || 0;
      const regTotal = sprintReviewData.regulatoryStoriesTotal || 1;
      score = Math.round((regDone / regTotal) * 10);
    } else if (id === 'evidence_handled') {
      if (this.projectState.evidence_pack_status === 'in_progress') score = 9;
      else if (this.projectState.evidence_pack_status === 'deferred') score = 5;
      else score = 2;
    } else if (id === 'freeze_handled') {
      if (this.projectState.freeze_response === 'non_prod') score = 9;
      else if (this.projectState.freeze_response === 'emergency_exception') score = 6;
      else if (this.projectState.freeze_response === 'ignored') score = 2;
      else score = 5;
    } else if (id === 'stories_progressed') {
      const storiesDone = sprintReviewData.storiesDelivered || 0;
      const storiesTotal = sprintReviewData.storiesTotal || 1;
      score = Math.round((storiesDone / storiesTotal) * 10);
    } else if (id === 'fca_handled') {
      if (this.projectState.fca_response === 'reprioritised') score = 10;
      else if (this.projectState.fca_response === 'escalated') score = 6;
      else if (this.projectState.fca_response === 'timeline_extension') score = 7;
      else score = 3;
    } else if (id === 'regulatory_coverage') {
      const regDone = sprintReviewData.regulatoryStoriesDelivered || 0;
      const regTotal = sprintReviewData.regulatoryStoriesTotal || 1;
      score = Math.round((regDone / regTotal) * 10);
    } else if (id === 'release_decision') {
      if (this.projectState.release_decision === 'go') score = 10;
      else if (this.projectState.release_decision === 'escalated') score = 6;
      else score = 3;
    } else if (id === 'audit_readiness') {
      if (this.projectState.evidence_pack_status === 'complete' || this.projectState.evidence_pack_status === 'in_progress') score = 10;
      else if (this.projectState.evidence_pack_status === 'deferred') score = 5;
      else score = 1;
    } else if (id === 'regulatory_compliance') {
      const trustOk = (this.projectState.risk_manager_trust || 0) >= 40;
      score = trustOk ? 10 : 4;
    } else {
      score = 5;
    }

    const weightedScore = Math.round(score * weight);
    return {
      criterion_id: id,
      description: criterion.description,
      rawScore: score,
      weight,
      score: weightedScore
    };
  }

  getProjectState() {
    return { ...this.projectState };
  }

  getEventLog() {
    return [...this.eventLog];
  }

  calculateFinalScore() {
    const criteria = this.scenario.success_criteria;
    const results = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const c of criteria) {
      let score = 0;
      const weight = c.weight;

      switch (c.id) {
        case 'regulatory_stories_100pct': {
          const trust = this.projectState.risk_manager_trust || 0;
          score = trust >= 60 ? 100 : trust >= 40 ? 70 : trust >= 20 ? 40 : 10;
          break;
        }
        case 'audit_approval': {
          const trust = this.projectState.auditor_trust || 0;
          score = trust >= 60 ? 100 : trust >= 50 ? 80 : trust >= 30 ? 50 : 10;
          break;
        }
        case 'risk_manager_approval': {
          const trust = this.projectState.risk_manager_trust || 0;
          score = trust >= 60 ? 100 : trust >= 50 ? 80 : trust >= 30 ? 50 : 10;
          break;
        }
        case 'po_satisfaction': {
          const trust = this.projectState.po_trust || 0;
          score = trust >= 50 ? 100 : trust >= 40 ? 75 : trust >= 20 ? 40 : 10;
          break;
        }
        case 'timeline_met': {
          score = this.projectState.timeline_breach ? 0 : 100;
          break;
        }
        case 'evidence_quality': {
          const status = this.projectState.evidence_pack_status;
          score = status === 'complete' ? 100 : status === 'in_progress' ? 60 : status === 'deferred' ? 30 : 0;
          break;
        }
        case 'governance_compliance': {
          const hasDispute = this.projectState.dod_disputed;
          score = hasDispute ? 30 : 100;
          break;
        }
        default:
          score = 50;
      }

      totalWeightedScore += score * weight;
      totalWeight += weight;

      results.push({
        id: c.id,
        description: c.description,
        score,
        weight,
        weightedScore: score * weight
      });
    }

    const finalPercentage = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;

    let grade = 'fail';
    if (finalPercentage >= 80) grade = 'distinction';
    else if (finalPercentage >= 65) grade = 'merit';
    else if (finalPercentage >= 50) grade = 'pass';
    else if (finalPercentage >= 35) grade = 'near_miss';

    let narrative = '';
    if (grade === 'distinction') {
      narrative = 'Exceptional performance. You navigated regulatory pressure, stakeholder dynamics, and delivery constraints with skill. This is a portfolio-worthy example of regulated Agile delivery.';
    } else if (grade === 'merit') {
      narrative = 'Strong performance. You made mostly sound decisions. Review the areas where stakeholder trust dropped to refine your approach further.';
    } else if (grade === 'pass') {
      narrative = 'Adequate performance. The project delivered but with notable friction. Revisit stakeholder management and regulatory rigour in your approach.';
    } else if (grade === 'near_miss') {
      narrative = 'The project struggled. Key regulatory or stakeholder requirements were not met. Consider how earlier investment in compliance and stakeholder trust would have changed the outcome.';
    } else {
      narrative = 'The project did not succeed. Significant gaps in regulatory compliance, stakeholder trust, or delivery. Review the debrief notes carefully.';
    }

    return {
      finalPercentage,
      grade,
      narrative,
      criteriaResults: results,
      totalWeightedScore,
      totalWeight,
      projectState: { ...this.projectState }
    };
  }

  markEvidenceComplete() {
    this.projectState.evidence_pack_status = 'complete';
    this.pe.updateState({ evidence_pack_status: 'complete' });
    this.eventLog.push({
      type: 'state_change',
      message: 'Evidence pack marked as complete',
      timestamp: Date.now()
    });
  }

  exportPortfolioEvidence() {
    return {
      scenario: {
        id: this.scenario.id,
        title: this.scenario.title
      },
      context: this.scenario.context,
      decisionsMade: this.decisionsMade,
      sprintResults: Object.values(this.sprintResults),
      projectState: this.projectState,
      finalScore: this.calculateFinalScore(),
      eventLog: this.eventLog,
      sessionLog: this.pe.exportSessionLog(),
      exportedAt: new Date().toISOString()
    };
  }
}
