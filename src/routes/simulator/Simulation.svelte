<script>
  import { onMount } from 'svelte';
  import { navigate } from '../../lib/router.js';
  import { progress } from '../../lib/stores/progress.js';
  import { PersonaEngine } from '../../lib/engines/persona-engine.js';
  import { ScenarioRunner } from '../../lib/engines/scenario-runner.js';
  import Button from '../../lib/components/Button.svelte';
  import Badge from '../../lib/components/Badge.svelte';
  import Card from '../../lib/components/Card.svelte';
  import Modal from '../../lib/components/Modal.svelte';
  import FeatureGate from '../../lib/components/FeatureGate.svelte';
  import { getDefaultClient } from '../../lib/engines/byok-client.js';

  export let scenarioId;

  let scenarioData = null;
  let personaDataMap = {};
  let loading = true;
  let error = null;
  let runner = null;
  let personaEngine = null;

  let simStarted = false;
  let sprintActive = false;
  let sprintCompleted = false;
  let simCompleted = false;
  let currentSprintData = null;
  let currentSprintNumber = 0;
  let sprintDay = 0;
  let sprintDuration = 0;
  let backlog = [];
  let availableDecisions = [];
  let eventLog = [];
  let projectState = {};
  let personaTrust = [];
  let pendingEvents = [];
  let showSprintReview = false;
  let sprintResult = null;
  let finalResult = null;
  let showFinalResults = false;
  let reviewChecklist = {};
  let velocityData = [];
  let dayDecision = null;
  let aiDebrief = '';
  let aiDebriefLoading = false;

  async function loadAIDebrief() {
    if (aiDebriefLoading || aiDebrief) return;
    aiDebriefLoading = true;
    const byokClient = getDefaultClient();
    if (byokClient?.isAvailable()) {
      const decisionLog = runner?.getEventLog?.() || [];
      const feedback = await byokClient.getSimulationDebrief(decisionLog, finalResult, scenarioId);
      if (feedback) aiDebrief = feedback;
    }
    aiDebriefLoading = false;
  }

  let activePersonas = [];

  const personaIds = ['product-owner-challenger', 'risk-manager-tier1', 'internal-auditor'];

  onMount(async () => {
    try {
      const scenarioModule = await import(`../../data/scenarios/${scenarioId}.json`);
      scenarioData = scenarioModule.default || scenarioModule;
      if (!scenarioData || scenarioData.id !== scenarioId) {
        error = 'Scenario not found';
        loading = false;
        return;
      }

      const personaLoads = personaIds.map(async (pid) => {
        const mod = await import(`../../data/personas/${pid}.json`);
        const pData = mod.default || mod;
        personaDataMap[pid] = pData;
        return pData;
      });
      const loadedPersonas = await Promise.all(personaLoads);

      const activePersonaData = loadedPersonas.filter(p =>
        scenarioData.personas_active.includes(p.id)
      );
      activePersonas = activePersonaData;

      const initialEngineState = {
        dod_choice: null,
        regulatory_pressure: 'normal',
        evidence_pack_status: 'none',
        sprint_number: 0,
        sprint_velocity_trend: 'stable',
        budget_variance: 0,
        backlog_size: scenarioData.sprints[0]?.initial_backlog?.length || 0,
        days_to_governance_milestone: 180,
        change_freeze_active: false,
        team_capacity_percentage: 100
      };

      personaEngine = new PersonaEngine(activePersonaData, initialEngineState);
      runner = new ScenarioRunner(scenarioData, personaEngine);

      personaTrust = personaEngine.getTrustSummary();
      projectState = runner.getProjectState();
      eventLog = runner.getEventLog();
      loading = false;
    } catch (err) {
      error = err.message || 'Failed to load simulation';
      loading = false;
    }
  });

  function startSimulation() {
    simStarted = true;
    startSprint(1);
  }

  function startSprint(num) {
    currentSprintNumber = num;
    const result = runner.startSprint(num);
    if (!result) return;

    currentSprintData = result.sprint;
    sprintDuration = result.sprint.duration_days;
    sprintDay = 0;
    backlog = result.sprint.backlog;
    availableDecisions = result.availableDecisions;
    sprintActive = true;
    sprintCompleted = false;
    sprintResult = null;
    showSprintReview = false;
    pendingEvents = result.events || [];

    for (const e of pendingEvents) {
      if (e.personaEvents) {
        for (const pe of e.personaEvents) {
          eventLog = runner.getEventLog();
        }
      }
    }

    processPendingDecisions();
    eventLog = runner.getEventLog();
    personaTrust = personaEngine.getTrustSummary();
    projectState = runner.getProjectState();
  }

  function processPendingDecisions() {
    const allDecisions = [];
    for (const e of pendingEvents) {
      if (e.type === 'decision' && e.decisionId) {
        const sprint = scenarioData.sprints.find(s => s.sprint_number === currentSprintNumber);
        if (sprint) {
          const dec = sprint.available_decisions.find(d => d.id === e.decisionId);
          if (dec) allDecisions.push(dec);
        }
      }
    }
    if (allDecisions.length > 0) {
      availableDecisions = [...availableDecisions, ...allDecisions];
    }
    pendingEvents = [];
  }

  function advanceDay() {
    if (sprintDay >= sprintDuration) {
      showSprintReview = true;
      return;
    }

    sprintDay++;
    const result = runner.advanceDay(sprintDay);
    if (!result) return;

    for (const event of result.events) {
      if (event.personaEvents) {
        for (const pe of event.personaEvents) {
          pendingEvents.push(pe);
        }
      }
      if (event.type === 'decision' && event.decisionId) {
        const sprint = scenarioData.sprints.find(s => s.sprint_number === currentSprintNumber);
        if (sprint) {
          const dec = sprint.available_decisions.find(d => d.id === event.decisionId);
          if (dec && !availableDecisions.find(d => d.id === dec.id)) {
            availableDecisions = [...availableDecisions, dec];
          }
        }
      }
    }

    eventLog = runner.getEventLog();
    personaTrust = personaEngine.getTrustSummary();
    projectState = runner.getProjectState();

    if (sprintDay >= sprintDuration) {
      showSprintReview = true;
    }
  }

  function makeDecision(decisionId, choiceId) {
    const result = runner.processDecision(decisionId, choiceId);
    if (!result || !result.success) return;

    availableDecisions = availableDecisions.filter(d => d.id !== decisionId);
    eventLog = runner.getEventLog();
    personaTrust = personaEngine.getTrustSummary();
    projectState = runner.getProjectState();
    backlog = currentSprintData.backlog;

    if (choiceId === 'evidence-prepare-now' && projectState.evidence_pack_status === 'in_progress') {
      setTimeout(() => {
        runner.markEvidenceComplete();
        eventLog = runner.getEventLog();
        projectState = runner.getProjectState();
      }, 500);
    }
  }

  function submitSprintReview() {
    const storiesDelivered = reviewChecklist.storiesDelivered || 0;
    const storiesTotal = backlog.length || 1;
    const regStories = backlog.filter(s => s.type === 'regulatory');
    const regDelivered = reviewChecklist.regulatoryDelivered || 0;

    const reviewData = {
      storiesDelivered: Number(storiesDelivered),
      storiesTotal: Number(storiesTotal),
      regulatoryStoriesDelivered: Number(regDelivered),
      regulatoryStoriesTotal: regStories.length || 1
    };

    sprintResult = runner.completeSprint(reviewData);
    sprintCompleted = true;
    sprintActive = false;
    showSprintReview = true;

    velocityData = [...velocityData, {
      sprint: currentSprintNumber,
      score: sprintResult.percentage
    }];

    eventLog = runner.getEventLog();
    personaTrust = personaEngine.getTrustSummary();
    projectState = runner.getProjectState();

    if (currentSprintNumber >= scenarioData.sprints.length) {
      simCompleted = true;
      finalResult = runner.calculateFinalScore();
      showFinalResults = true;

      progress.update(p => ({
        ...p,
        completed_simulations: [...new Set([...p.completed_simulations, scenarioId])]
      }));
    }
  }

  function nextSprint() {
    showSprintReview = false;
    sprintCompleted = false;
    sprintActive = false;
    availableDecisions = [];
    startSprint(currentSprintNumber + 1);
  }

  function resetSimulation() {
    const initialEngineState = {
      dod_choice: null,
      regulatory_pressure: 'normal',
      evidence_pack_status: 'none',
      sprint_number: 0,
      sprint_velocity_trend: 'stable',
      budget_variance: 0,
      backlog_size: scenarioData.sprints[0]?.initial_backlog?.length || 0,
      days_to_governance_milestone: 180,
      change_freeze_active: false,
      team_capacity_percentage: 100
    };
    personaEngine = new PersonaEngine(activePersonas, initialEngineState);
    runner = new ScenarioRunner(scenarioData, personaEngine);

    simStarted = false;
    sprintActive = false;
    sprintCompleted = false;
    simCompleted = false;
    currentSprintData = null;
    currentSprintNumber = 0;
    sprintDay = 0;
    backlog = [];
    availableDecisions = [];
    eventLog = [];
    projectState = {};
    personaTrust = [];
    pendingEvents = [];
    showSprintReview = false;
    sprintResult = null;
    finalResult = null;
    showFinalResults = false;
    velocityData = [];
    dayDecision = null;
    reviewChecklist = {};

    personaTrust = personaEngine.getTrustSummary();
    projectState = runner.getProjectState();
    eventLog = runner.getEventLog();
  }

  function exportEvidence() {
    if (!runner) return;
    const evidence = runner.exportPortfolioEvidence();
    const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agilefocus-evidence-${scenarioId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function getStoryTypeBadgeVariant(type) {
    return type === 'regulatory' ? 'regulatory' : 'info';
  }

  function getStoryTypeLabel(type) {
    return type === 'regulatory' ? 'Regulatory' : 'Business';
  }

  function getRiskBadgeVariant(risk) {
    if (risk === 'low') return 'success';
    if (risk === 'medium') return 'warning';
    return 'danger';
  }

  function getTrustCategory(score) {
    if (score > 70) return 'allied';
    if (score >= 40) return 'neutral';
    if (score >= 20) return 'resistant';
    return 'hostile';
  }

  function getTrustColor(score) {
    if (score > 70) return '#3fb950';
    if (score >= 40) return '#58a6ff';
    if (score >= 20) return '#d29922';
    return '#f85149';
  }

  function getRegulatoryPressureColor(pressure) {
    if (pressure === 'critical') return '#f85149';
    if (pressure === 'elevated') return '#d29922';
    return '#3fb950';
  }

  function isBarChartValue(obj) {
    return obj && typeof obj === 'object' && 'sprint' in obj;
  }

  $: currentSprintMeta = scenarioData ? scenarioData.sprints.find(s => s.sprint_number === currentSprintNumber) : null;
</script>

<div class="sim">
  {#if loading}
    <div class="sim__loading">
      <div class="sim__spinner"></div>
      <p>Loading simulation...</p>
    </div>
  {:else if error}
    <div class="sim__error">
      <h2>Error</h2>
      <p>{error}</p>
      <Button variant="secondary" on:click={() => navigate('/simulator')}>Back to Simulations</Button>
    </div>
  {:else}
    <div class="sim__layout">
      <aside class="sim__sidebar sim__sidebar--left">
        <div class="sidebar__section">
          <h3 class="sidebar__title">Personas</h3>
          {#each personaTrust as pt (pt.persona_id)}
            <div class="sidebar__persona">
              <div class="trust-ring" style="--trust-color: {getTrustColor(pt.trust_score)};">
                <svg viewBox="0 0 40 40" class="trust-ring__svg">
                  <circle cx="20" cy="20" r="17" fill="none" stroke="var(--color-bg-surface)" stroke-width="4" />
                  <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="4"
                    stroke-dasharray="106.8" stroke-dashoffset={106.8 - (106.8 * pt.trust_score / 100)}
                    stroke-linecap="round" transform="rotate(-90 20 20)" />
                  <text x="20" y="20" text-anchor="middle" dominant-baseline="central"
                    font-size="10" font-family="var(--font-display)" fill="var(--color-text-primary)">
                    {pt.trust_score}
                  </text>
                </svg>
              </div>
              <div class="sidebar__persona-info">
                <strong>{pt.name}</strong>
                <span class="sidebar__persona-role">{pt.role}</span>
                <span class="sidebar__persona-trust" class:trust--allied={pt.trust_category === 'allied'} class:trust--neutral={pt.trust_category === 'neutral'} class:trust--resistant={pt.trust_category === 'resistant'} class:trust--hostile={pt.trust_category === 'hostile'}>
                  {pt.trust_category}
                </span>
              </div>
            </div>
          {/each}
        </div>

        <div class="sidebar__section">
          <h3 class="sidebar__title">Project State</h3>
          <div class="sidebar__state-grid">
            <div class="sidebar__state-item">
              <span class="sidebar__state-label">Sprint</span>
              <span class="sidebar__state-value">{currentSprintNumber || '-'} / {scenarioData.sprints.length}</span>
            </div>
            <div class="sidebar__state-item">
              <span class="sidebar__state-label">Velocity</span>
              <span class="sidebar__state-value" class:value--warning={projectState.sprint_velocity_trend === 'declining'}>
                {projectState.sprint_velocity_trend || 'stable'}
              </span>
            </div>
            <div class="sidebar__state-item">
              <span class="sidebar__state-label">Regulatory</span>
              <span class="sidebar__state-value" style="color: {getRegulatoryPressureColor(projectState.regulatory_pressure)};">
                {projectState.regulatory_pressure}
              </span>
            </div>
            <div class="sidebar__state-item">
              <span class="sidebar__state-label">Evidence</span>
              <span class="sidebar__state-value">{projectState.evidence_pack_status || 'none'}</span>
            </div>
            <div class="sidebar__state-item">
              <span class="sidebar__state-label">DoD</span>
              <span class="sidebar__state-value">{projectState.dod_choice || '—'}</span>
            </div>
            <div class="sidebar__state-item">
              <span class="sidebar__state-label">Deadline</span>
              <span class="sidebar__state-value">{projectState.days_to_governance_milestone || 180}d</span>
            </div>
          </div>
        </div>

        <div class="sidebar__section">
          <h3 class="sidebar__title">Actions</h3>
          <div class="sidebar__actions">
            <Button variant="ghost" size="sm" on:click={exportEvidence}>Export Evidence</Button>
            <Button variant="ghost" size="sm" on:click={resetSimulation}>Reset</Button>
            <Button variant="ghost" size="sm" on:click={() => navigate('/simulator')}>Back</Button>
          </div>
        </div>
      </aside>

      <main class="sim__main">
        {#if !simStarted}
          <div class="sim__intro">
            <header class="sim__intro-header">
              <div>
                <h1>{scenarioData.title}</h1>
                <Badge variant="level" text="Level {scenarioData.level_required}" />
              </div>
            </header>

            <Card>
              <div class="sim__context">
                <h2>Context</h2>
                <div class="sim__context-grid">
                  <div class="sim__context-item">
                    <strong>Organisation</strong>
                    <span>{scenarioData.context.organisation.name}</span>
                    <small>{scenarioData.context.organisation.type} · {scenarioData.context.organisation.customers.toLocaleString()} customers · {scenarioData.context.organisation.authorisation_status}</small>
                  </div>
                  <div class="sim__context-item">
                    <strong>Regulatory Context</strong>
                    <span>{scenarioData.context.regulatory_context}</span>
                  </div>
                  <div class="sim__context-item">
                    <strong>Team</strong>
                    <span>{scenarioData.context.team_composition.developers} Developers · {scenarioData.context.team_composition.qa} QA · {scenarioData.context.team_composition.ba} BA (You) · {scenarioData.context.team_composition.product_owner} PO</span>
                  </div>
                  <div class="sim__context-item">
                    <strong>Sprints</strong>
                    <span>{scenarioData.sprints.length} sprints · {scenarioData.sprints.reduce((sum, s) => sum + s.duration_days, 0)} total days</span>
                  </div>
                </div>

                <h3 style="margin-top: var(--space-6);">Sprint Overview</h3>
                <div class="sim__sprint-list">
                  {#each scenarioData.sprints as sprint (sprint.sprint_number)}
                    <div class="sim__sprint-overview">
                      <strong>Sprint {sprint.sprint_number}:</strong>
                      <span>{sprint.goal}</span>
                      <small>({sprint.duration_days} days)</small>
                    </div>
                  {/each}
                </div>

                <div class="sim__personas-section">
                  <h3>Active Personas</h3>
                  <div class="sim__personas-list">
                    {#each activePersonas as p (p.id)}
                      <div class="sim__persona-card">
                        <strong>{p.name}</strong>
                        <span class="sim__persona-role">{p.role}</span>
                        <p>{p.agenda}</p>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            </Card>

            <div class="sim__start-area">
              <Button variant="primary" size="lg" on:click={startSimulation}>
                Begin Simulation
              </Button>
            </div>
          </div>

        {:else if showFinalResults && finalResult}
          <div class="sim__final">
            <header class="sim__final-header">
              <h1>Simulation Complete</h1>
              <Badge variant={finalResult.grade === 'distinction' || finalResult.grade === 'merit' ? 'success' : finalResult.grade === 'pass' ? 'info' : 'warning'} text={finalResult.grade} />
            </header>

            <div class="sim__final-score">
              <div class="sim__score-ring" style="--score: {finalResult.finalPercentage}%;">
                <svg viewBox="0 0 120 120" class="sim__score-svg">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-bg-surface)" stroke-width="8" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-accent-primary)" stroke-width="8"
                    stroke-dasharray="326.7" stroke-dashoffset={326.7 - (326.7 * finalResult.finalPercentage / 100)}
                    stroke-linecap="round" transform="rotate(-90 60 60)" />
                  <text x="60" y="56" text-anchor="middle" dominant-baseline="central"
                    font-size="24" font-weight="700" font-family="var(--font-display)" fill="var(--color-text-primary)">
                    {finalResult.finalPercentage}%
                  </text>
                  <text x="60" y="78" text-anchor="middle" dominant-baseline="central"
                    font-size="10" font-family="var(--font-display)" fill="var(--color-text-secondary)">
                    {finalResult.grade}
                  </text>
                </svg>
              </div>
            </div>

            <p class="sim__final-narrative">{finalResult.narrative}</p>

            <Card>
              <h3>Criteria Results</h3>
              <div class="sim__criteria-list">
                {#each finalResult.criteriaResults as cr (cr.id)}
                  <div class="sim__criterion">
                    <div class="sim__criterion-header">
                      <span class="sim__criterion-desc">{cr.description}</span>
                      <span class="sim__criterion-score" style="color: {cr.score >= 70 ? 'var(--color-accent-success)' : cr.score >= 40 ? 'var(--color-accent-warning)' : 'var(--color-accent-danger)'};">
                        {cr.score}%
                      </span>
                    </div>
                    <div class="sim__criterion-bar">
                      <div class="sim__criterion-fill" style="width: {cr.score}%; background: {cr.score >= 70 ? 'var(--color-accent-success)' : cr.score >= 40 ? 'var(--color-accent-warning)' : 'var(--color-accent-danger)'};"></div>
                    </div>
                  </div>
                {/each}
              </div>
            </Card>

            {#if velocityData.length > 0}
              <Card>
                <h3>Velocity Trend</h3>
                <div class="sim__chart">
                  {#each velocityData as v (v.sprint)}
                    <div class="sim__bar" style="height: {v.score}%;" title="Sprint {v.sprint}: {v.score}%">
                      <span class="sim__bar-label">{v.sprint}</span>
                    </div>
                  {/each}
                </div>
              </Card>
            {/if}

            <FeatureGate>
              <div slot="ai">
                {#if aiDebriefLoading}
                  <p class="sim__ai-loading">Generating AI debrief...</p>
                {:else if aiDebrief}
                  <Card variant="info">
                    <h3>AI Coaching Debrief</h3>
                    <p class="sim__ai-text">{aiDebrief}</p>
                  </Card>
                {:else}
                  <Button variant="ghost" size="md" on:click={loadAIDebrief}>Get AI Debrief</Button>
                {/if}
              </div>
              <div slot="fallback"></div>
            </FeatureGate>

            <div class="sim__final-actions">
              <Button variant="primary" on:click={exportEvidence}>Export Portfolio Evidence</Button>
              <Button variant="secondary" on:click={resetSimulation}>Replay Simulation</Button>
              <Button variant="secondary" on:click={() => navigate('/simulator')}>Back to Simulations</Button>
            </div>
          </div>

        {:else if showSprintReview || sprintCompleted}
          <div class="sim__review">
            <h1>Sprint {currentSprintNumber} Review</h1>
            <p class="sim__review-goal">{currentSprintMeta?.goal}</p>

            <Card>
              <h3>Sprint Review Checklist</h3>
              <div class="sim__checklist">
                <label class="sim__check-item">
                  <input type="checkbox" bind:checked={reviewChecklist.storiesDeliveredCounted} />
                  <span>Count stories delivered this sprint</span>
                </label>
                <div class="sim__check-field">
                  <label for="storiesDelivered">Stories delivered this sprint:</label>
                  <input id="storiesDelivered" type="number" min="0" max={backlog.length || 1} bind:value={reviewChecklist.storiesDelivered} placeholder="0" />
                  <small>of {backlog.length || 1} total</small>
                </div>
                <div class="sim__check-field">
                  <label for="regulatoryDelivered">Regulatory stories delivered:</label>
                  <input id="regulatoryDelivered" type="number" min="0" max={backlog.filter(s => s.type === 'regulatory').length || 1} bind:value={reviewChecklist.regulatoryDelivered} placeholder="0" />
                  <small>of {backlog.filter(s => s.type === 'regulatory').length || 1} total</small>
                </div>
              </div>
            </Card>

            {#if sprintResult}
              <Card variant={sprintResult.passed ? 'success' : 'warning'}>
                <div class="sim__review-score">
                  <div>
                    <h3>Sprint Score</h3>
                    <p class="sim__score-big">{sprintResult.percentage}%</p>
                    <p class="sim__score-detail">{sprintResult.score} / {sprintResult.maxScore} — {sprintResult.passed ? 'PASSED' : 'BELOW THRESHOLD'}</p>
                  </div>
                  <div class="sim__sprint-velocity">
                    <h4>Velocity</h4>
                    <div class="sim__chart sim__chart--small">
                      {#each velocityData as v (v.sprint)}
                        <div class="sim__bar" style="height: {v.score}%;" title="Sprint {v.sprint}: {v.score}%">
                          <span class="sim__bar-label">{v.sprint}</span>
                        </div>
                      {/each}
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3>Persona Reactions</h3>
                <div class="sim__reactions">
                  {#each personaTrust as pt (pt.persona_id)}
                    <div class="sim__reaction">
                      <div class="sim__reaction-avatar" style="background: {getTrustColor(pt.trust_score)};">
                        {pt.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div class="sim__reaction-body">
                        <strong>{pt.name}</strong>
                        <span class="sim__reaction-role">{pt.role}</span>
                        <p class="sim__reaction-text">
                          Trust: {pt.trust_score} ({pt.trust_category})
                        </p>
                      </div>
                    </div>
                  {/each}
                </div>
              </Card>
            {/if}

            <div class="sim__review-actions">
              {#if sprintResult && !simCompleted}
                <Button variant="primary" on:click={nextSprint}>
                  Start Sprint {currentSprintNumber + 1}
                </Button>
              {:else if !sprintResult}
                <Button variant="primary" on:click={submitSprintReview}>
                  Complete Sprint Review
                </Button>
              {:else if simCompleted}
                <Button variant="primary" on:click={() => { showFinalResults = true; }}>
                  View Final Results
                </Button>
              {/if}
            </div>
          </div>

        {:else}
          <div class="sim__sprint">
            <header class="sim__sprint-header">
              <div class="sim__sprint-header-info">
                <h1>Sprint {currentSprintNumber}</h1>
                <p class="sim__sprint-goal">{currentSprintMeta?.goal}</p>
              </div>
              <div class="sim__sprint-stats">
                <Badge variant="info" text="Day {sprintDay}/{sprintDuration}" />
                <Badge variant={currentSprintMeta?.injected_events?.length > 0 ? 'warning' : 'info'} text="{backlog.length} stories" />
              </div>
            </header>

            {#if availableDecisions.length > 0}
              <section class="sim__decisions">
                <h2>Decision Required</h2>
                {#each availableDecisions as decision (decision.id)}
                  <Card variant="warning" elevated>
                    <div class="sim__decision-card">
                      <h3>{decision.title}</h3>
                      <p class="sim__decision-desc">{decision.description}</p>
                      <div class="sim__decision-options">
                        {#each decision.options as option (option.id)}
                          {#if !option.condition || option.condition === 'true' || (option.condition === 'risk_manager_trust >= 40' && (projectState.risk_manager_trust || 0) >= 40)}
                            <button class="sim__option-card" on:click={() => makeDecision(decision.id, option.id)}>
                              <div class="sim__option-header">
                                <strong>{option.label}</strong>
                                <Badge variant={getRiskBadgeVariant(option.risk)} text={option.risk} />
                              </div>
                              <p class="sim__option-desc">{option.description}</p>
                            </button>
                          {/if}
                        {/each}
                      </div>
                    </div>
                  </Card>
                {/each}
              </section>
            {/if}

            <section class="sim__backlog">
              <h2>Backlog</h2>
              <div class="sim__backlog-stats">
                <span class="sim__stat">
                  Total: <strong>{backlog.length}</strong> stories
                </span>
                <span class="sim__stat">
                  Points: <strong>{backlog.reduce((sum, s) => sum + (s.points || 0), 0)}</strong>
                </span>
                <span class="sim__stat">
                  Regulatory: <strong class="stat--regulatory">{backlog.filter(s => s.type === 'regulatory').length}</strong>
                </span>
                <span class="sim__stat">
                  Business: <strong class="stat--business">{backlog.filter(s => s.type === 'business').length}</strong>
                </span>
              </div>
              <div class="sim__backlog-cards">
                {#each backlog as story (story.id)}
                  <div class="sim__story-card" class:sim__story-card--modified={story.modified} class:sim__story-card--injected={story.injected}>
                    <div class="sim__story-meta">
                      <Badge variant={getStoryTypeBadgeVariant(story.type)} text={getStoryTypeLabel(story.type)} />
                      <span class="sim__story-points">{story.points}pt</span>
                      {#if story.modified}
                        <Badge variant="warning" text="Modified" />
                      {/if}
                      {#if story.injected}
                        <Badge variant="danger" text="New" />
                      {/if}
                    </div>
                    <p class="sim__story-title">{story.title}</p>
                    {#if story.description}
                      <p class="sim__story-desc">{story.description}</p>
                    {/if}
                  </div>
                {/each}
              </div>
            </section>

            <div class="sim__sprint-controls">
              <Button variant="primary" on:click={advanceDay} disabled={sprintDay >= sprintDuration}>
                {sprintDay < sprintDuration ? `Advance to Day ${sprintDay + 1}` : 'Proceed to Sprint Review'}
              </Button>
              <span class="sim__day-indicator">Day {sprintDay} of {sprintDuration}</span>
            </div>
          </div>
        {/if}
      </main>

      <aside class="sim__sidebar sim__sidebar--right">
        <div class="sidebar__section">
          <h3 class="sidebar__title">Event Log</h3>
          <div class="sidebar__event-log">
            {#if eventLog.length === 0}
              <p class="sidebar__empty">No events yet</p>
            {:else}
              {#each [...eventLog].reverse() as event (event.timestamp + (event.message || ''))}
                <div class="sidebar__event" class:event--decision={event.type === 'decision'} class:event--persona={event.type === 'persona_response'} class:event--state={event.type === 'state_change'} class:event--sprint={event.type === 'sprint_start' || event.type === 'sprint_complete'}>
                  <div class="sidebar__event-header">
                    <span class="sidebar__event-type">
                      {#if event.type === 'decision'}Decision
                      {:else if event.type === 'persona_response'}{event.persona_name || 'Persona'}
                      {:else if event.type === 'state_change'}System
                      {:else if event.type === 'sprint_start'}Sprint Start
                      {:else if event.type === 'sprint_complete'}Sprint End
                      {:else}Event
                      {/if}
                    </span>
                    <span class="sidebar__event-time">
                      {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <p class="sidebar__event-message">{event.message || event.description || ''}</p>
                  {#if event.trust_delta}
                    <span class="sidebar__event-trust" class:delta--positive={event.trust_delta > 0} class:delta--negative={event.trust_delta < 0}>
                      {event.trust_delta > 0 ? '+' : ''}{event.trust_delta}
                    </span>
                  {/if}
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </aside>
    </div>
  {/if}
</div>

<style>
  .sim {
    min-height: calc(100vh - 120px);
  }

  .sim__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-16);
    gap: var(--space-4);
    color: var(--color-text-secondary);
  }

  .sim__spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-accent-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .sim__error {
    padding: var(--space-16);
    text-align: center;
    color: var(--color-accent-danger);
  }

  .sim__layout {
    display: grid;
    grid-template-columns: 240px 1fr 240px;
    gap: var(--space-4);
    min-height: calc(100vh - 140px);
  }

  .sim__sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    position: sticky;
    top: var(--space-4);
    align-self: start;
    max-height: calc(100vh - 140px);
    overflow-y: auto;
  }

  .sidebar__section {
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
  }

  .sidebar__title {
    font-size: var(--text-xs);
    font-family: var(--font-display);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-secondary);
    margin-bottom: var(--space-3);
  }

  .sidebar__persona {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    align-items: center;
  }

  .sidebar__persona + .sidebar__persona {
    border-top: 1px solid var(--color-border);
  }

  .trust-ring {
    width: 40px;
    height: 40px;
    color: var(--trust-color);
    flex-shrink: 0;
  }

  .trust-ring__svg {
    width: 100%;
    height: 100%;
  }

  .sidebar__persona-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  .sidebar__persona-info strong {
    font-size: var(--text-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sidebar__persona-role {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .sidebar__persona-trust {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    font-weight: 500;
  }

  .trust--allied { color: var(--color-accent-success); }
  .trust--neutral { color: var(--color-accent-secondary); }
  .trust--resistant { color: var(--color-accent-warning); }
  .trust--hostile { color: var(--color-accent-danger); }

  .sidebar__state-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);
  }

  .sidebar__state-item {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .sidebar__state-label {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .sidebar__state-value {
    font-size: var(--text-sm);
    font-weight: 600;
    font-family: var(--font-display);
  }

  .value--warning {
    color: var(--color-accent-warning);
  }

  .sidebar__actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .sidebar__actions :global(.btn) {
    width: 100%;
    justify-content: flex-start;
  }

  .sidebar__event-log {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    max-height: 500px;
    overflow-y: auto;
  }

  .sidebar__empty {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    text-align: center;
    padding: var(--space-4);
  }

  .sidebar__event {
    padding: var(--space-2);
    border-radius: var(--radius-sm);
    border-left: 3px solid var(--color-border);
    font-size: var(--text-xs);
  }

  .event--decision { border-left-color: var(--color-accent-secondary); background: rgba(88, 166, 255, 0.05); }
  .event--persona { border-left-color: var(--color-regulatory); background: rgba(188, 140, 255, 0.05); }
  .event--state { border-left-color: var(--color-accent-warning); background: rgba(210, 153, 34, 0.05); }
  .event--sprint { border-left-color: var(--color-accent-primary); background: rgba(240, 136, 62, 0.05); }

  .sidebar__event-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
  }

  .sidebar__event-type {
    font-weight: 600;
    font-family: var(--font-display);
    font-size: var(--text-xs);
  }

  .sidebar__event-time {
    color: var(--color-text-secondary);
    font-size: 10px;
  }

  .sidebar__event-message {
    color: var(--color-text-secondary);
    line-height: 1.4;
  }

  .sidebar__event-trust {
    font-weight: 600;
    font-size: 10px;
  }

  .delta--positive { color: var(--color-accent-success); }
  .delta--negative { color: var(--color-accent-danger); }

  .sim__main {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    padding-bottom: var(--space-8);
  }

  .sim__intro-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-6);
  }

  .sim__context h2 {
    margin-bottom: var(--space-4);
  }

  .sim__context-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .sim__context-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .sim__context-item strong {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-text-secondary);
    font-family: var(--font-display);
  }

  .sim__context-item span {
    font-size: var(--text-sm);
  }

  .sim__context-item small {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .sim__sprint-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  .sim__sprint-overview {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    font-size: var(--text-sm);
  }

  .sim__sprint-overview small {
    color: var(--color-text-secondary);
  }

  .sim__personas-section {
    margin-top: var(--space-6);
  }

  .sim__personas-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-3);
    margin-top: var(--space-3);
  }

  .sim__persona-card {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-4);
  }

  .sim__persona-card strong {
    display: block;
    font-size: var(--text-sm);
  }

  .sim__persona-role {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .sim__persona-card p {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    margin-top: var(--space-2);
    font-style: italic;
  }

  .sim__start-area {
    display: flex;
    justify-content: center;
    padding: var(--space-8);
  }

  .sim__sprint-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .sim__sprint-header-info h1 {
    font-size: var(--text-2xl);
  }

  .sim__sprint-goal {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin-top: var(--space-1);
  }

  .sim__sprint-stats {
    display: flex;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  .sim__decisions {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .sim__decisions h2 {
    font-size: var(--text-lg);
    color: var(--color-accent-warning);
  }

  .sim__decision-card h3 {
    margin-bottom: var(--space-2);
  }

  .sim__decision-desc {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-4);
  }

  .sim__decision-options {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .sim__option-card {
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    cursor: pointer;
    text-align: left;
    color: var(--color-text-primary);
    font-family: var(--font-body);
    width: 100%;
    transition: border-color var(--transition-fast), background var(--transition-fast);
  }

  .sim__option-card:hover {
    border-color: var(--color-accent-primary);
    background: var(--color-bg-surface);
  }

  .sim__option-card:focus-visible {
    outline: 2px solid var(--color-accent-secondary);
    outline-offset: 2px;
  }

  .sim__option-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-1);
  }

  .sim__option-desc {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .sim__backlog h2 {
    font-size: var(--text-lg);
    margin-bottom: var(--space-3);
  }

  .sim__backlog-stats {
    display: flex;
    gap: var(--space-4);
    font-size: var(--text-sm);
    margin-bottom: var(--space-4);
  }

  .sim__stat strong {
    font-family: var(--font-display);
  }

  .stat--regulatory { color: var(--color-regulatory); }
  .stat--business { color: var(--color-accent-secondary); }

  .sim__backlog-cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .sim__story-card {
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .sim__story-card--modified {
    border-left: 3px solid var(--color-accent-warning);
  }

  .sim__story-card--injected {
    border-left: 3px solid var(--color-accent-danger);
    animation: slide-in 0.3s ease-out;
  }

  @keyframes slide-in {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .sim__story-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .sim__story-points {
    font-size: var(--text-xs);
    font-family: var(--font-display);
    color: var(--color-text-secondary);
    font-weight: 600;
  }

  .sim__story-title {
    font-size: var(--text-sm);
    font-weight: 500;
  }

  .sim__story-desc {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .sim__sprint-controls {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4) 0;
  }

  .sim__day-indicator {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    font-family: var(--font-display);
  }

  .sim__review h1 {
    font-size: var(--text-2xl);
    margin-bottom: var(--space-1);
  }

  .sim__review-goal {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-6);
  }

  .sim__checklist {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .sim__check-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    cursor: pointer;
  }

  .sim__check-field {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
  }

  .sim__check-field label {
    flex-shrink: 0;
  }

  .sim__check-field input {
    width: 64px;
    padding: var(--space-1) var(--space-2);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-family: var(--font-body);
    font-size: var(--text-sm);
  }

  .sim__check-field small {
    color: var(--color-text-secondary);
  }

  .sim__review-score {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-6);
  }

  .sim__score-big {
    font-size: var(--text-4xl);
    font-family: var(--font-display);
    font-weight: 700;
    margin: var(--space-1) 0;
  }

  .sim__score-detail {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .sim__sprint-velocity {
    flex-shrink: 0;
  }

  .sim__sprint-velocity h4 {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-text-secondary);
    margin-bottom: var(--space-2);
  }

  .sim__chart {
    display: flex;
    align-items: flex-end;
    gap: var(--space-2);
    height: 120px;
    padding: var(--space-2) 0;
  }

  .sim__chart--small {
    height: 80px;
    width: 200px;
  }

  .sim__bar {
    flex: 1;
    background: var(--color-accent-primary);
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    min-height: 4px;
    position: relative;
    transition: height 0.3s ease;
    opacity: 0.8;
  }

  .sim__bar:hover {
    opacity: 1;
  }

  .sim__bar-label {
    position: absolute;
    bottom: -18px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    color: var(--color-text-secondary);
    white-space: nowrap;
  }

  .sim__reactions {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .sim__reaction {
    display: flex;
    gap: var(--space-3);
    align-items: flex-start;
  }

  .sim__reaction-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    color: #fff;
    flex-shrink: 0;
  }

  .sim__reaction-body strong {
    display: block;
    font-size: var(--text-sm);
  }

  .sim__reaction-role {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .sim__reaction-text {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    margin-top: var(--space-1);
    font-style: italic;
  }

  .sim__review-actions {
    display: flex;
    gap: var(--space-3);
    justify-content: flex-end;
    padding-top: var(--space-4);
  }

  .sim__final {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .sim__final-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sim__final-score {
    display: flex;
    justify-content: center;
    padding: var(--space-4);
  }

  .sim__score-ring {
    width: 120px;
    height: 120px;
  }

  .sim__score-svg {
    width: 100%;
    height: 100%;
  }

  .sim__final-narrative {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: 1.6;
    max-width: 600px;
  }

  .sim__criteria-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-top: var(--space-3);
  }

  .sim__criterion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-1);
  }

  .sim__criterion-desc {
    font-size: var(--text-sm);
  }

  .sim__criterion-score {
    font-size: var(--text-sm);
    font-weight: 600;
    font-family: var(--font-display);
  }

  .sim__criterion-bar {
    height: 6px;
    background: var(--color-bg-primary);
    border-radius: 3px;
    overflow: hidden;
  }

  .sim__criterion-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
  }

  .sim__final-actions {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .sim__ai-loading { font-size: var(--text-sm); color: var(--color-accent-secondary); padding: var(--space-2) 0; }
  .sim__ai-text { font-size: var(--text-sm); line-height: 1.6; color: var(--color-text-secondary); white-space: pre-wrap; }
</style>
