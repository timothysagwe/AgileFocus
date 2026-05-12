<script>
  import { navigate } from '../../lib/router.js';
  import { project } from '../../lib/stores/project.js';
  import { progress } from '../../lib/stores/progress.js';
  import Button from '../../lib/components/Button.svelte';
  import Badge from '../../lib/components/Badge.svelte';
  import Card from '../../lib/components/Card.svelte';

  $: p = $project;
  $: completed = p.completed_phases?.includes('process-modelling');

  $: bpmnExercisesCompleted = ($progress.completed_exercises?.length || 0) >= 2;
  $: modelScore = bpmnExercisesCompleted ? 75 : 30;

  function completePhase() {
    const score = modelScore;
    project.completePhase('process-modelling', {
      model_score: score,
      bpmn_quality: score,
      control_points: score >= 70 ? 80 : 40,
      overall_score: score,
      percentage: score
    });
    navigate('/project');
  }

  function goToBpmn() {
    navigate('/bpmn');
  }
</script>

<div class="phase">
  <div class="phase__header">
    <button class="phase__back" on:click={() => navigate('/project')}>← Dashboard</button>
    <Badge variant="info" text="Phase 3 of 7" />
  </div>

  <h1 class="phase__title">Process Modelling</h1>
  <p class="phase__subtitle">Model the fraud alert triage process using BPMN. Complete BPMN exercises to improve your model quality.</p>

  {#if completed}
    <div class="phase__completed-banner">
      <p>✓ Process modelling complete. Continue to delivery.</p>
      <Button variant="primary" on:click={() => navigate('/project/delivery')}>Continue to Delivery</Button>
    </div>
  {/if}

  <div class="phase__content" class:phase__content--disabled={completed}>
    <Card>
      <div class="phase__exercise-card">
        <h2>BPMN Process Modelling</h2>
        <p>Your BPMN modelling skills affect the quality of the process models in this project. Complete the BPMN exercises to build better process models.</p>

        <div class="phase__score">
          <span class="phase__score-label">Model Quality Score</span>
          <span class="phase__score-value" class:phase__score-value--good={modelScore >= 70}>{modelScore}%</span>
        </div>

        {#if !bpmnExercisesCompleted}
          <div class="phase__suggestion">
            <p>Complete the BPMN exercises to improve your model quality score and unlock better delivery outcomes.</p>
            <Button variant="secondary" on:click={goToBpmn}>Go to BPMN Exercises</Button>
          </div>
        {:else}
          <Badge variant="success" text="BPMN exercises completed" />
        {/if}
      </div>
    </Card>

    <div class="phase__actions">
      <Button variant="ghost" on:click={() => navigate('/project')}>Back to Dashboard</Button>
      <Button variant="primary" on:click={completePhase}>Complete Modelling Phase</Button>
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
  .phase__exercise-card { padding: var(--space-2); display: flex; flex-direction: column; gap: var(--space-4); }
  .phase__exercise-card h2 { font-size: var(--text-xl); font-weight: 600; }
  .phase__score { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); background: var(--color-bg-primary); border-radius: var(--radius-sm); }
  .phase__score-label { font-size: var(--text-sm); color: var(--color-text-secondary); }
  .phase__score-value { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 700; }
  .phase__score-value--good { color: var(--color-accent-success); }
  .phase__suggestion { padding: var(--space-3); border: 1px solid var(--color-accent-warning); background: rgba(210, 153, 34, 0.08); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: var(--space-3); align-items: flex-start; }
  .phase__suggestion p { font-size: var(--text-sm); color: var(--color-text-secondary); }
  .phase__actions { display: flex; justify-content: space-between; padding-top: var(--space-4); }
</style>
