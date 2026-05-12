<script>
  import { navigate } from '../../lib/router.js';
  import { project } from '../../lib/stores/project.js';
  import { progress } from '../../lib/stores/progress.js';
  import Button from '../../lib/components/Button.svelte';
  import Badge from '../../lib/components/Badge.svelte';
  import Card from '../../lib/components/Card.svelte';

  $: p = $project;
  $: completed = p.completed_phases?.includes('delivery');
  $: simCompleted = ($progress.completed_simulations?.length || 0) > 0;

  $: sprintCount = simCompleted ? 6 : 0;
  $: avgScore = 65;
  $: deliveryScore = Math.round((avgScore * 0.5 + (simCompleted ? 80 : 0) * 0.5));
  $: phaseState = project.getPhaseState('delivery');
  $: crossState = phaseState.crossPhaseState;

  function goToSimulator() {
    navigate('/simulator');
  }

  function completePhase() {
    const score = deliveryScore;
    project.completePhase('delivery', {
      average_sprint_score: avgScore,
      delivery_consistency: score,
      regulatory_compliance: crossState.evidence_pack_status === 'complete' ? 80 : 50,
      stakeholder_trust: phaseState.trust,
      evidence_pack_status: crossState.evidence_pack_status || 'none',
      dod_choice: crossState.dod_choice,
      overall_score: score,
      percentage: score,
      budget_variance: 0,
      decisions_made: phaseState.decisionLog || []
    });
    navigate('/project');
  }
</script>

<div class="phase">
  <div class="phase__header">
    <button class="phase__back" on:click={() => navigate('/project')}>← Dashboard</button>
    <Badge variant="info" text="Phase 4 of 7" />
  </div>

  <h1 class="phase__title">Agile Delivery</h1>
  <p class="phase__subtitle">Run the Meridian Bank fraud alert triage project across 6 sprints.</p>

  {#if completed}
    <div class="phase__completed-banner">
      <p>✓ Delivery complete. Continue to governance gate.</p>
      <Button variant="primary" on:click={() => navigate('/project/governance')}>Continue to Governance</Button>
    </div>
  {/if}

  <div class="phase__content" class:phase__content--disabled={completed}>
    <Card>
      <div class="phase__sim-card">
        <h2>Meridian Bank — Fraud Alert Triage</h2>
        <p>Navigate 6 sprints of a regulated financial services project. Make decisions, manage stakeholders, and deliver under regulatory pressure.</p>

        <div class="phase__sim-stats">
          <div class="phase__sim-stat">
            <span class="phase__sim-stat-label">Sprints Completed</span>
            <span class="phase__sim-stat-value">{sprintCount}/6</span>
          </div>
          <div class="phase__sim-stat">
            <span class="phase__sim-stat-label">Delivery Score</span>
            <span class="phase__sim-stat-value">{deliveryScore}%</span>
          </div>
        </div>

        {#if simCompleted}
          <Badge variant="success" text="Simulation completed" />
        {:else}
          <div class="phase__suggestion">
            <p>Run the full simulation to complete this phase. Your decisions will carry forward to the governance and audit phases.</p>
            <Button variant="primary" on:click={goToSimulator}>Run Simulation</Button>
          </div>
        {/if}
      </div>
    </Card>

    <div class="phase__actions">
      <Button variant="ghost" on:click={() => navigate('/project')}>Back to Dashboard</Button>
      <Button variant="primary" disabled={!simCompleted} on:click={completePhase}>
        {simCompleted ? 'Complete Delivery Phase' : 'Complete Simulation First'}
      </Button>
    </div>
  </div>
</div>

<style>
  .phase { padding: var(--space-4) 0; max-width: 720px; margin: 0 auto; }
  .phase__header { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-6); }
  .phase__back { background: none; border: none; color: var(--color-accent-secondary); cursor: pointer; font-family: inherit; font-size: var(--text-sm); padding: 0; }
  .phase__back:hover { text-decoration: underline; }
  .phase__title { font-family: var(--font-display); font-size: var(--text-3xl); font-weight: 700; margin-bottom: var(--space-2); }
  .phase__subtitle { color: var(--color-text-secondary); margin-bottom: var(--space-8); }
  .phase__completed-banner { padding: var(--space-4); background: rgba(63, 185, 80, 0.1); border: 1px solid var(--color-accent-success); border-radius: var(--radius-md); margin-bottom: var(--space-8); display: flex; justify-content: space-between; align-items: center; gap: var(--space-4); flex-wrap: wrap; }
  .phase__content { display: flex; flex-direction: column; gap: var(--space-6); }
  .phase__content--disabled { opacity: 0.5; pointer-events: none; }
  .phase__sim-card { padding: var(--space-2); display: flex; flex-direction: column; gap: var(--space-4); }
  .phase__sim-card h2 { font-size: var(--text-xl); font-weight: 600; }
  .phase__sim-stats { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
  .phase__sim-stat { padding: var(--space-3); background: var(--color-bg-primary); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: var(--space-1); }
  .phase__sim-stat-label { font-size: var(--text-xs); color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
  .phase__sim-stat-value { font-family: var(--font-display); font-size: var(--text-xl); font-weight: 700; }
  .phase__suggestion { padding: var(--space-3); border: 1px solid var(--color-accent-warning); background: rgba(210, 153, 34, 0.08); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: var(--space-3); align-items: flex-start; }
  .phase__suggestion p { font-size: var(--text-sm); color: var(--color-text-secondary); }
  .phase__actions { display: flex; justify-content: space-between; padding-top: var(--space-4); }
</style>
