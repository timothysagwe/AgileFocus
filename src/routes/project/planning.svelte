<script>
  import { navigate } from '../../lib/router.js';
  import { project } from '../../lib/stores/project.js';
  import Button from '../../lib/components/Button.svelte';
  import Badge from '../../lib/components/Badge.svelte';

  let requirements = '';
  let regulatoryRequirements = '';
  let storiesCount = 10;
  let prioritisationMethod = 'moSCoW';

  $: p = $project;
  $: completed = p.completed_phases?.includes('planning');
  $: canSubmit = requirements.length > 20;

  function completePhase() {
    const reqQuality = Math.min(100, requirements.length * 1.5);
    const regQuality = Math.min(100, regulatoryRequirements.length * 2);
    const storyQuality = storiesCount >= 8 ? 80 : storiesCount >= 5 ? 60 : 30;

    project.completePhase('planning', {
      requirements_quality: reqQuality,
      story_quality: storyQuality,
      regulatory_coverage: regQuality,
      regulatory_requirements_identified: regulatoryRequirements.length > 10,
      prioritisation: prioritisationMethod === 'moSCoW' ? 80 : 60,
      overall_score: Math.round((reqQuality * 0.3 + storyQuality * 0.25 + regQuality * 0.3 + 70 * 0.15)),
      percentage: Math.round((reqQuality * 0.3 + storyQuality * 0.25 + regQuality * 0.3 + 70 * 0.15))
    }, {
      requirements_doc: requirements,
      regulatory_requirements: regulatoryRequirements.split('\n').filter(r => r.trim()),
      prioritisation_method: prioritisationMethod
    });

    navigate('/project');
  }
</script>

<div class="phase">
  <div class="phase__header">
    <button class="phase__back" on:click={() => navigate('/project')}>← Dashboard</button>
    <Badge variant="info" text="Phase 2 of 7" />
  </div>

  <h1 class="phase__title">Planning & Requirements</h1>
  <p class="phase__subtitle">Elicit requirements, write user stories, identify regulatory needs.</p>

  {#if completed}
    <div class="phase__completed-banner">
      <p>✓ Planning complete. Continue to process modelling.</p>
      <Button variant="primary" on:click={() => navigate('/project/process-modelling')}>Continue to Modelling</Button>
    </div>
  {/if}

  <div class="phase__form" class:phase__form--disabled={completed}>
    <div class="phase__card">
      <h2>1. Requirements Elicitation</h2>
      <p class="phase__card-hint">What are the key functional requirements for the fraud alert triage system?</p>
      <textarea
        class="phase__textarea"
        bind:value={requirements}
        placeholder="List the key requirements. Consider:&#10;- Real-time transaction monitoring&#10;- Automated alert generation&#10;- Case management dashboard&#10;- Suspicious Activity Report generation&#10;- Audit trail for all actions"
        rows="6"
      ></textarea>
    </div>

    <div class="phase__card">
      <h2>2. Regulatory Requirements</h2>
      <p class="phase__card-hint">Identify regulatory requirements that apply (FCA, PRA, etc.)</p>
      <textarea
        class="phase__textarea"
        bind:value={regulatoryRequirements}
        placeholder="FCA SYSC requirements for financial crime systems&#10;PRA Rulebook: Outsourcing and third-party risk&#10;FCA COBS: Client money and asset reporting"
        rows="4"
      ></textarea>
    </div>

    <div class="phase__card">
      <h2>3. Estimation</h2>
      <p class="phase__card-hint">How many user stories do you estimate for the initial backlog?</p>
      <div class="phase__estimation">
        <input type="range" min="3" max="20" bind:value={storiesCount} class="phase__slider" />
        <span class="phase__estimation-value">{storiesCount} stories</span>
      </div>
    </div>

    <div class="phase__card">
      <h2>4. Prioritisation Method</h2>
      <p class="phase__card-hint">How will you prioritise the backlog?</p>
      <div class="phase__radio-group">
        {#each ['moSCoW', 'rice', 'kano', 'value-effort'] as method}
          <label class="phase__radio-item">
            <input type="radio" bind:group={prioritisationMethod} value={method} />
            <span>{method.charAt(0).toUpperCase() + method.slice(1)}</span>
          </label>
        {/each}
      </div>
    </div>

    <div class="phase__actions">
      <Button variant="ghost" on:click={() => navigate('/project')}>Save & Exit</Button>
      <Button variant="primary" disabled={!canSubmit} on:click={completePhase}>Complete Planning</Button>
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
  .phase__form { display: flex; flex-direction: column; gap: var(--space-6); }
  .phase__form--disabled { opacity: 0.5; pointer-events: none; }
  .phase__card { padding: var(--space-6); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-bg-surface); }
  .phase__card h2 { font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-2); }
  .phase__card-hint { font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-4); }
  .phase__textarea { width: 100%; background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-3); color: var(--color-text-primary); font-family: var(--font-body); font-size: var(--text-sm); resize: vertical; }
  .phase__textarea:focus { outline: none; border-color: var(--color-accent-secondary); }
  .phase__estimation { display: flex; align-items: center; gap: var(--space-4); }
  .phase__slider { flex: 1; accent-color: var(--color-accent-primary); }
  .phase__estimation-value { font-family: var(--font-display); font-weight: 600; min-width: 80px; }
  .phase__radio-group { display: flex; gap: var(--space-3); flex-wrap: wrap; }
  .phase__radio-item { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer; font-size: var(--text-sm); }
  .phase__actions { display: flex; justify-content: space-between; padding-top: var(--space-4); }
</style>
