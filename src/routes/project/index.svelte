<script>
  import { navigate } from '../../lib/router.js';
  import { project, phaseList, nextAction } from '../../lib/stores/project.js';
  import Button from '../../lib/components/Button.svelte';
  import Badge from '../../lib/components/Badge.svelte';
  import Card from '../../lib/components/Card.svelte';

  $: phases = $phaseList;
  $: next = $nextAction;
  $: p = $project;
  $: health = p.project_health || {};
  $: trust = p.stakeholder_trust || {};

  function goToPhase(phaseId) {
    navigate(`/project/${phaseId}`);
  }

  function startOrContinue() {
    if (!p.started) {
      navigate('/project/initiation');
    } else {
      navigate(`/project/${p.current_phase}`);
    }
  }

  const healthIndicators = [
    { key: 'timeline', label: 'Timeline', color: 'var(--color-accent-secondary)' },
    { key: 'budget', label: 'Budget', color: 'var(--color-accent-success)' },
    { key: 'quality', label: 'Quality', color: 'var(--color-accent-primary)' },
    { key: 'stakeholder_trust', label: 'Stakeholder Trust', color: 'var(--color-accent-warning)' },
    { key: 'regulatory_compliance', label: 'Compliance', color: 'var(--color-regulatory)' }
  ];

  function healthColor(val) {
    if (val >= 70) return 'var(--color-accent-success)';
    if (val >= 40) return 'var(--color-accent-warning)';
    return 'var(--color-accent-danger)';
  }
</script>

<div class="dashboard">
  {#if !p.started}
    <div class="dashboard__hero">
      <div class="dashboard__hero-content">
        <h1 class="dashboard__title">AgileFocus</h1>
        <p class="dashboard__subtitle">Project Lifecycle Simulator for IT Project Managers & Business Analysts</p>
        <p class="dashboard__description">
          Walk through a complete regulated project lifecycle — from initiation to audit.
          Make real decisions, manage stakeholders, and build your portfolio.
        </p>
        <div class="dashboard__actions">
          <Button variant="primary" size="lg" on:click={startOrContinue}>Start Your Project</Button>
        </div>
        <div class="dashboard__scenario-preview">
          <Card>
            <div class="dashboard__scenario-info">
              <Badge variant="info" text="Level 1" />
              <span class="dashboard__scenario-title">Meridian Bank — Fraud Alert Triage</span>
              <span class="dashboard__scenario-meta">Financial Services • 6 Months • 7 Phases</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  {:else if p.is_complete}
    <div class="dashboard__complete">
      <h1>Project Complete</h1>
      <p>You have completed the full project lifecycle. View your portfolio and final grade.</p>
      <Button variant="primary" size="lg" on:click={() => navigate('/project/retrospective')}>View Portfolio</Button>
    </div>
  {:else}
    <div class="dashboard__active">
      <div class="dashboard__header">
        <div>
          <h1 class="dashboard__title">Project Dashboard</h1>
          <p class="dashboard__subtitle">
            Role: {p.role === 'pm' ? 'Project Manager' : 'Business Analyst'} • 
            Phase {p.phase_index + 1} of {p.total_phases}
          </p>
        </div>
        <Button variant="primary" on:click={startOrContinue}>
          Continue: {$next.text.split(': ')[1] || $next.text}
        </Button>
      </div>

      <div class="dashboard__health">
        <h2 class="dashboard__section-title">Project Health</h2>
        <div class="dashboard__health-grid">
          {#each healthIndicators as indicator}
            <div class="dashboard__health-card" style="--health-color: {healthColor(health[indicator.key] || 50)};">
              <span class="dashboard__health-label">{indicator.label}</span>
              <span class="dashboard__health-value">{Math.round(health[indicator.key] || 50)}%</span>
              <div class="dashboard__health-bar">
                <div class="dashboard__health-fill" style="width: {Math.round(health[indicator.key] || 50)}%"></div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="dashboard__lifecycle">
        <h2 class="dashboard__section-title">Project Lifecycle</h2>
        <div class="dashboard__phase-list">
          {#each phases as phase (phase.id)}
            <button
              class="dashboard__phase"
              class:dashboard__phase--current={phase.current}
              class:dashboard__phase--completed={phase.completed}
              class:dashboard__phase--locked={!phase.unlocked}
              disabled={!phase.unlocked}
              on:click={() => goToPhase(phase.id)}
            >
              <div class="dashboard__phase-indicator">
                {#if phase.completed}
                  <span class="dashboard__phase-check">✓</span>
                {:else if phase.current}
                  <span class="dashboard__phase-dot"></span>
                {:else}
                  <span class="dashboard__phase-num">{phase.icon}</span>
                {/if}
              </div>
              <div class="dashboard__phase-info">
                <span class="dashboard__phase-title">{phase.short}</span>
                {#if phase.current}
                  <span class="dashboard__phase-badge badge--active">In Progress</span>
                {:else if phase.completed}
                  <span class="dashboard__phase-badge badge--done">Complete</span>
                {:else if !phase.unlocked}
                  <span class="dashboard__phase-badge badge--locked">Locked</span>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </div>

      <div class="dashboard__stakeholders">
        <h2 class="dashboard__section-title">Stakeholder Trust</h2>
        <div class="dashboard__stakeholder-grid">
          {#each Object.entries(trust) as [key, val]}
            <div class="dashboard__stakeholder-item">
              <span class="dashboard__stakeholder-name">{key.replace(/_/g, ' ')}</span>
              <div class="dashboard__stakeholder-bar">
                <div class="dashboard__stakeholder-fill" style="width: {Math.round(val)}%; background: {healthColor(val)}"></div>
              </div>
              <span class="dashboard__stakeholder-value">{Math.round(val)}%</span>
            </div>
          {/each}
        </div>
      </div>

      {#if p.decision_log.length > 0}
        <div class="dashboard__log">
          <h2 class="dashboard__section-title">Decision Log ({p.decision_log.length})</h2>
          <div class="dashboard__log-list">
            {#each p.decision_log.slice(-5).reverse() as decision}
              <div class="dashboard__log-entry">
                <span class="dashboard__log-decision">{decision.decision_title || decision.label || 'Decision'}</span>
                <span class="dashboard__log-choice">{decision.choice_label}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .dashboard { padding: var(--space-4) 0; }

  .dashboard__hero {
    min-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: var(--space-12) var(--space-6);
  }

  .dashboard__hero-content {
    max-width: 640px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
  }

  .dashboard__title {
    font-family: var(--font-display);
    font-size: var(--text-4xl);
    font-weight: 700;
    letter-spacing: -0.03em;
  }

  .dashboard__subtitle {
    font-size: var(--text-lg);
    color: var(--color-text-secondary);
  }

  .dashboard__description {
    font-size: var(--text-base);
    color: var(--color-text-secondary);
    line-height: 1.6;
    max-width: 480px;
  }

  .dashboard__actions {
    margin-top: var(--space-4);
  }

  .dashboard__scenario-preview {
    margin-top: var(--space-8);
    width: 100%;
    max-width: 400px;
  }

  .dashboard__scenario-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    align-items: center;
    padding: var(--space-2);
  }

  .dashboard__scenario-title {
    font-weight: 600;
    font-size: var(--text-base);
  }

  .dashboard__scenario-meta {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .dashboard__active {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }

  .dashboard__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .dashboard__section-title {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 600;
    margin-bottom: var(--space-4);
  }

  .dashboard__health-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--space-3);
  }

  .dashboard__health-card {
    padding: var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .dashboard__health-label {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .dashboard__health-value {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--health-color, var(--color-text-primary));
  }

  .dashboard__health-bar {
    height: 4px;
    background: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
  }

  .dashboard__health-fill {
    height: 100%;
    background: var(--health-color, var(--color-accent-primary));
    border-radius: 2px;
    transition: width 0.5s ease;
  }

  .dashboard__lifecycle {
    background: var(--color-bg-secondary);
    padding: var(--space-6);
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
  }

  .dashboard__phase-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .dashboard__phase {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-bg-surface);
    cursor: pointer;
    transition: border-color var(--transition-fast), background var(--transition-fast);
    flex: 1;
    min-width: 140px;
    text-align: left;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
  }

  .dashboard__phase:hover:not(:disabled) {
    border-color: var(--color-accent-primary);
    background: var(--color-bg-primary);
  }

  .dashboard__phase:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .dashboard__phase--current {
    border-color: var(--color-accent-primary);
    background: rgba(240, 136, 62, 0.08);
  }

  .dashboard__phase--completed {
    border-color: var(--color-accent-success);
  }

  .dashboard__phase-indicator {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-lg);
    flex-shrink: 0;
  }

  .dashboard__phase-check {
    color: var(--color-accent-success);
    font-weight: 700;
    font-size: var(--text-lg);
  }

  .dashboard__phase-dot {
    width: 12px;
    height: 12px;
    background: var(--color-accent-primary);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  .dashboard__phase-num {
    font-size: var(--text-lg);
  }

  .dashboard__phase-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .dashboard__phase-title {
    font-weight: 600;
    font-size: var(--text-sm);
  }

  .dashboard__phase-badge {
    font-size: 10px;
    font-family: var(--font-display);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .badge--active { color: var(--color-accent-primary); }
  .badge--done { color: var(--color-accent-success); }
  .badge--locked { color: var(--color-text-secondary); }

  .dashboard__stakeholder-grid {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    max-width: 500px;
  }

  .dashboard__stakeholder-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .dashboard__stakeholder-name {
    font-size: var(--text-sm);
    min-width: 140px;
    text-transform: capitalize;
  }

  .dashboard__stakeholder-bar {
    flex: 1;
    height: 6px;
    background: var(--color-border);
    border-radius: 3px;
    overflow: hidden;
  }

  .dashboard__stakeholder-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
  }

  .dashboard__stakeholder-value {
    font-size: var(--text-sm);
    font-family: var(--font-display);
    min-width: 40px;
    text-align: right;
  }

  .dashboard__log-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .dashboard__log-entry {
    display: flex;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
  }

  .dashboard__log-decision {
    font-weight: 500;
  }

  .dashboard__log-choice {
    color: var(--color-text-secondary);
  }

  .dashboard__complete {
    text-align: center;
    padding: var(--space-16);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
</style>
