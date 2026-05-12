<script>
  import { navigate } from '../../lib/router.js';
  import { project } from '../../lib/stores/project.js';
  import { progress } from '../../lib/stores/progress.js';
  import Button from '../../lib/components/Button.svelte';
  import Badge from '../../lib/components/Badge.svelte';
  import Card from '../../lib/components/Card.svelte';

  $: p = $project;
  $: completed = p.completed_phases?.includes('governance');

  $: govTopicsCompleted = ($progress.completed_modules?.length || 0);
  $: cabDone = $progress.completed_modules?.includes('governance-topic-1');
  $: dodDone = $progress.completed_modules?.includes('governance-topic-2');
  $: traceDone = $progress.completed_modules?.includes('governance-topic-3');
  $: govScore = Math.round(
    ((cabDone ? 80 : 0) + (dodDone ? 80 : 0) + (traceDone ? 80 : 0)) / 3
  );

  function goToTopic(topic) {
    navigate(`/learn/governance/topic-${topic}`);
  }

  function completePhase() {
    const score = govScore;
    project.completePhase('governance', {
      cab_submitted: cabDone,
      cab_quality: cabDone ? 75 : 0,
      dod_completeness: dodDone ? 80 : 0,
      traceability_complete: traceDone,
      audit_readiness: (cabDone && dodDone && traceDone) ? 80 : 30,
      overall_score: score,
      percentage: score
    });
    navigate('/project');
  }
</script>

<div class="phase">
  <div class="phase__header">
    <button class="phase__back" on:click={() => navigate('/project')}>← Dashboard</button>
    <Badge variant="info" text="Phase 5 of 7" />
  </div>

  <h1 class="phase__title">Governance Gate</h1>
  <p class="phase__subtitle">Navigate CAB, Definition of Done, and traceability requirements.</p>

  {#if completed}
    <div class="phase__completed-banner">
      <p>✓ Governance complete. Continue to audit.</p>
      <Button variant="primary" on:click={() => navigate('/project/audit')}>Continue to Audit</Button>
    </div>
  {/if}

  <div class="phase__content" class:phase__content--disabled={completed}>
    <div class="phase__topics">
      <Card>
        <div class="phase__topic-item" class:phase__topic-item--done={cabDone}>
          <div class="phase__topic-info">
            <h3>1. CAB Submission</h3>
            <p>Prepare a Change Advisory Board submission with impact assessment and rollback plan.</p>
          </div>
          {#if cabDone}
            <Badge variant="success" text="Complete" />
          {:else}
            <Button variant="secondary" on:click={() => goToTopic(1)}>Complete CAB</Button>
          {/if}
        </div>
      </Card>
      <Card>
        <div class="phase__topic-item" class:phase__topic-item--done={dodDone}>
          <div class="phase__topic-info">
            <h3>2. Definition of Done</h3>
            <p>Establish a regulated DoD covering functional, security, compliance, and audit criteria.</p>
          </div>
          {#if dodDone}
            <Badge variant="success" text="Complete" />
          {:else}
            <Button variant="secondary" on:click={() => goToTopic(2)}>Complete DoD</Button>
          {/if}
        </div>
      </Card>
      <Card>
        <div class="phase__topic-item" class:phase__topic-item--done={traceDone}>
          <div class="phase__topic-info">
            <h3>3. Traceability</h3>
            <p>Establish requirement-to-test-to-deployment traceability for audit readiness.</p>
          </div>
          {#if traceDone}
            <Badge variant="success" text="Complete" />
          {:else}
            <Button variant="secondary" on:click={() => goToTopic(3)}>Complete Traceability</Button>
          {/if}
        </div>
      </Card>
    </div>

    <div class="phase__score">
      <span class="phase__score-label">Governance Score</span>
      <span class="phase__score-value">{govScore}%</span>
    </div>

    <div class="phase__actions">
      <Button variant="ghost" on:click={() => navigate('/project')}>Back to Dashboard</Button>
      <Button variant="primary" on:click={completePhase}>Complete Governance Phase</Button>
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
  .phase__topics { display: flex; flex-direction: column; gap: var(--space-3); }
  .phase__topic-item { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-2); }
  .phase__topic-item--done { opacity: 0.6; }
  .phase__topic-info { flex: 1; }
  .phase__topic-info h3 { font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-1); }
  .phase__topic-info p { font-size: var(--text-sm); color: var(--color-text-secondary); }
  .phase__score { padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg-surface); display: flex; align-items: center; justify-content: space-between; }
  .phase__score-label { font-size: var(--text-base); font-weight: 500; }
  .phase__score-value { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 700; }
  .phase__actions { display: flex; justify-content: space-between; padding-top: var(--space-4); }
</style>
