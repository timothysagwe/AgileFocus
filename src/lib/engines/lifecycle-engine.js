const PHASES = ['initiation', 'planning', 'process-modelling', 'delivery', 'governance', 'audit', 'retrospective'];

const PHASE_LABELS = {
  initiation: { title: 'Project Initiation', icon: '🚀', short: 'Initiation' },
  planning: { title: 'Planning & Requirements', icon: '📋', short: 'Planning' },
  'process-modelling': { title: 'Process Modelling', icon: '📐', short: 'Modelling' },
  delivery: { title: 'Agile Delivery', icon: '🔄', short: 'Delivery' },
  governance: { title: 'Governance Gate', icon: '🛡️', short: 'Governance' },
  audit: { title: 'Internal Audit', icon: '🔍', short: 'Audit' },
  retrospective: { title: 'Retrospective', icon: '📝', short: 'Retro' }
};

export function getPhaseLabel(phaseId) {
  return PHASE_LABELS[phaseId] || { title: phaseId, icon: '📌', short: phaseId };
}

export function getPhases() {
  return [...PHASES];
}

export function getNextPhase(phaseId) {
  const idx = PHASES.indexOf(phaseId);
  if (idx === -1 || idx >= PHASES.length - 1) return null;
  return PHASES[idx + 1];
}

export function getPreviousPhase(phaseId) {
  const idx = PHASES.indexOf(phaseId);
  if (idx <= 0) return null;
  return PHASES[idx - 1];
}

export function isPhaseUnlocked(phaseId, projectProgress) {
  if (!projectProgress) return phaseId === 'initiation';
  const idx = PHASES.indexOf(phaseId);
  if (idx === 0) return true;
  const prevPhase = PHASES[idx - 1];
  return projectProgress.completed_phases?.includes(prevPhase) || false;
}

export function buildDefaultProjectState(role = 'pm') {
  return {
    role,
    started: null,
    completed: null,
    current_phase: 'initiation',
    completed_phases: [],
    phase_results: {},
    artefacts: {},
    project_health: {
      timeline: 100,
      budget: 100,
      quality: 100,
      stakeholder_trust: 50,
      regulatory_compliance: 50
    },
    stakeholder_trust: {
      product_owner: 50,
      risk_manager: 50,
      internal_auditor: 40,
      fca_supervisor: 50,
      senior_manager: 50
    },
    cross_phase_state: {
      dod_choice: null,
      evidence_pack_status: 'none',
      bpmn_quality_score: null,
      cab_submitted: false,
      audit_findings_count: 0,
      compliance_breaches: 0
    },
    decision_log: [],
    artefact_log: []
  };
}

export class LifecycleEngine {
  constructor(projectState) {
    this.state = projectState || buildDefaultProjectState();
  }

  get currentPhase() {
    return this.state.current_phase;
  }

  get completedPhases() {
    return [...(this.state.completed_phases || [])];
  }

  get isComplete() {
    return this.state.completed_phases?.includes('retrospective') || false;
  }

  get phaseIndex() {
    return PHASES.indexOf(this.state.current_phase);
  }

  startProject(role) {
    this.state.role = role;
    this.state.started = Date.now();
    this.state.current_phase = 'initiation';
    return this.getSnapshot();
  }

  completePhase(phaseId, results, artefacts) {
    if (!this.state.completed_phases.includes(phaseId)) {
      this.state.completed_phases.push(phaseId);
    }
    this.state.phase_results[phaseId] = { ...results, completed_at: Date.now() };
    if (artefacts) {
      this.state.artefacts[phaseId] = artefacts;
    }
    this.applyPhaseOutcomes(phaseId, results);
    const nextPhase = getNextPhase(phaseId);
    if (nextPhase) {
      this.state.current_phase = nextPhase;
    }
    if (phaseId === 'retrospective') {
      this.state.completed = Date.now();
    }
    return this.getSnapshot();
  }

  applyPhaseOutcomes(phaseId, results) {
    const cps = this.state.cross_phase_state;
    const health = this.state.project_health;

    switch (phaseId) {
      case 'initiation': {
        const roleQuality = results.role_selection_quality || 50;
        health.stakeholder_trust = Math.max(0, Math.min(100, 40 + roleQuality * 0.3));
        break;
      }
      case 'planning': {
        const reqQuality = results.requirements_quality || 50;
        cps.bpmn_quality_score = reqQuality;
        health.quality = Math.max(0, Math.min(100, 60 + reqQuality * 0.3));
        if (results.regulatory_requirements_identified) {
          health.regulatory_compliance = Math.max(0, Math.min(100, 50 + reqQuality * 0.3));
        }
        break;
      }
      case 'process-modelling': {
        const modelScore = results.model_score || 50;
        cps.bpmn_quality_score = modelScore;
        health.quality = Math.max(0, Math.min(100, health.quality + (modelScore - 50) * 0.2));
        break;
      }
      case 'delivery': {
        const sprintAvg = results.average_sprint_score || 50;
        health.timeline = Math.max(0, Math.min(100, sprintAvg * 0.8));
        health.budget = Math.max(0, Math.min(100, (results.budget_variance || 0) >= 0 ? 80 : 50));
        if (results.evidence_pack_status === 'complete') {
          cps.evidence_pack_status = 'complete';
        } else if (results.evidence_pack_status === 'in_progress') {
          cps.evidence_pack_status = 'in_progress';
        }
        if (results.dod_choice) cps.dod_choice = results.dod_choice;
        if (results.stakeholder_trust) {
          Object.assign(this.state.stakeholder_trust, results.stakeholder_trust);
        }
        this.state.decision_log.push(...(results.decisions_made || []));
        break;
      }
      case 'governance': {
        cps.cab_submitted = results.cab_submitted || false;
        health.regulatory_compliance = Math.max(0, Math.min(100,
          (health.regulatory_compliance || 50) + (results.cab_quality || 50) * 0.3
        ));
        if (results.traceability_complete) {
          health.quality = Math.max(0, Math.min(100, health.quality + 10));
        }
        break;
      }
      case 'audit': {
        cps.audit_findings_count = results.findings_count || 0;
        cps.compliance_breaches = results.compliance_breaches || 0;
        health.regulatory_compliance = Math.max(0, Math.min(100,
          (health.regulatory_compliance || 50) - (results.compliance_breaches || 0) * 10
        ));
        break;
      }
      case 'retrospective': {
        break;
      }
    }
  }

  calculateFinalScore() {
    const results = this.state.phase_results;
    const health = this.state.project_health;

    const phaseWeights = {
      initiation: 0.05,
      planning: 0.10,
      'process-modelling': 0.10,
      delivery: 0.35,
      governance: 0.15,
      audit: 0.15,
      retrospective: 0.10
    };

    let total = 0;
    let weightSum = 0;
    const breakdown = [];

    for (const [phaseId, weight] of Object.entries(phaseWeights)) {
      const phaseResult = results[phaseId];
      let phaseScore = 50;
      if (phaseResult) {
        phaseScore = phaseResult.overall_score ?? phaseResult.percentage ?? 50;
      }
      total += phaseScore * weight;
      weightSum += weight;
      breakdown.push({
        phase: phaseId,
        label: PHASE_LABELS[phaseId]?.title || phaseId,
        score: phaseScore,
        weight,
        weightedScore: phaseScore * weight
      });
    }

    const finalPercentage = weightSum > 0 ? Math.round(total / weightSum) : 0;

    let grade = 'fail';
    if (finalPercentage >= 80) grade = 'distinction';
    else if (finalPercentage >= 65) grade = 'merit';
    else if (finalPercentage >= 50) grade = 'pass';
    else if (finalPercentage >= 35) grade = 'near_miss';

    const narratives = {
      distinction: 'Exceptional project delivery. You demonstrated mastery of regulated Agile across the full lifecycle.',
      merit: 'Strong performance. Your project delivered with solid governance and stakeholder management.',
      pass: 'Adequate delivery. The project met its objectives but with room for improvement in several areas.',
      near_miss: 'The project struggled. Key regulatory or stakeholder requirements were not fully met.',
      fail: 'The project did not succeed. Significant gaps in project management and compliance.'
    };

    return {
      finalPercentage,
      grade,
      narrative: narratives[grade] || '',
      breakdown,
      projectHealth: { ...health },
      stakeholderTrust: { ...this.state.stakeholder_trust },
      totalArtefacts: Object.keys(this.state.artefacts).length,
      decisionsMade: this.state.decision_log.length,
      started: this.state.started,
      completed: this.state.completed
    };
  }

  getSnapshot() {
    return {
      ...this.state,
      phase_index: this.phaseIndex,
      is_complete: this.isComplete,
      total_phases: PHASES.length
    };
  }

  getPhaseState(phaseId) {
    return {
      health: { ...this.state.project_health },
      trust: { ...this.state.stakeholder_trust },
      crossPhaseState: { ...this.state.cross_phase_state },
      artefacts: this.state.artefacts[phaseId] || [],
      decisionLog: [...this.state.decision_log]
    };
  }
}
