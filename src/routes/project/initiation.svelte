<script>
  import { navigate } from '../../lib/router.js';
  import { project } from '../../lib/stores/project.js';
  import Button from '../../lib/components/Button.svelte';
  import Badge from '../../lib/components/Badge.svelte';

  let role = 'pm';
  let stakeholders = [];
  let scopeStatement = '';
  let risks = '';

  $: p = $project;
  $: health = p.project_health || {};
  $: completed = p.completed_phases?.includes('initiation');
  $: canSubmit = role && scopeStatement.length > 10 && stakeholders.length > 0;

  const stakeholderOptions = [
    { id: 'product-owner', label: 'Product Owner', required: true },
    { id: 'risk-manager', label: 'Risk Manager', required: true },
    { id: 'internal-auditor', label: 'Internal Auditor', required: true },
    { id: 'fca-supervisor', label: 'FCA Supervisor', required: false },
    { id: 'senior-manager', label: 'Senior Manager', required: false },
    { id: 'tech-lead', label: 'Technical Lead', required: false },
    { id: 'compliance-officer', label: 'Compliance Officer', required: false }
  ];

  function toggleStakeholder(id) {
    if (stakeholders.includes(id)) {
      stakeholders = stakeholders.filter(s => s !== id);
    } else {
      stakeholders = [...stakeholders, id];
    }
  }

  function completePhase() {
    const requiredMet = stakeholderOptions.filter(s => s.required).every(s => stakeholders.includes(s.id));
    const stakeholderCoverage = stakeholders.length >= 4 ? 90 : stakeholders.length >= 3 ? 70 : 40;
    const scopeQuality = Math.min(100, scopeStatement.length * 2);
    const riskQuality = Math.min(100, risks.length * 2);
    const overallScore = Math.round((stakeholderCoverage * 0.4 + scopeQuality * 0.3 + riskQuality * 0.2 + (requiredMet ? 90 : 30) * 0.1));

    project.completePhase('initiation', {
      role_selection: role === 'pm' ? 'Project Manager' : 'Business Analyst',
      role_selection_quality: 80,
      stakeholder_coverage: stakeholderCoverage,
      scope_definition: scopeQuality,
      risk_identification: riskQuality,
      overall_score: overallScore,
      percentage: overallScore
    }, {
      project_charter: { scope: scopeStatement, identified_risks: risks.split('\n').filter(r => r.trim()) },
      stakeholder_register: stakeholders
    });

    navigate('/project');
  }
</script>

<div class="phase">
  <div class="phase__header">
    <button class="phase__back" on:click={() => navigate('/project')}>← Dashboard</button>
    <Badge variant="info" text="Phase 1 of 7" />
  </div>

  <h1 class="phase__title">Project Initiation</h1>
  <p class="phase__subtitle">Define your project, choose your role, and identify stakeholders.</p>

  {#if completed}
    <div class="phase__completed-banner">
      <p>✓ Initiation complete. You can review your choices or continue to the next phase.</p>
      <Button variant="primary" on:click={() => navigate('/project/planning')}>Continue to Planning</Button>
    </div>
  {/if}

  <div class="phase__form" class:phase__form--disabled={completed}>
    <div class="phase__card">
      <h2>1. Select Your Role</h2>
      <p class="phase__card-hint">How will you lead this project?</p>
      <div class="phase__role-options">
        <label class="phase__role-card" class:phase__role-card--selected={role === 'pm'} on:click={() => role = 'pm'}>
          <span class="phase__role-icon">📊</span>
          <span class="phase__role-name">Project Manager</span>
          <span class="phase__role-desc">Own the timeline, budget, governance, and stakeholder management</span>
        </label>
        <label class="phase__role-card" class:phase__role-card--selected={role === 'ba'} on:click={() => role = 'ba'}>
          <span class="phase__role-icon">📋</span>
          <span class="phase__role-name">Business Analyst</span>
          <span class="phase__role-desc">Own requirements, process modelling, user stories, and acceptance criteria</span>
        </label>
      </div>
    </div>

    <div class="phase__card">
      <h2>2. Identify Stakeholders</h2>
      <p class="phase__card-hint">Who needs to be engaged for this fraud alert triage project?</p>
      <div class="phase__stakeholder-grid">
        {#each stakeholderOptions as s}
          <label class="phase__stakeholder-item" class:phase__stakeholder-item--selected={stakeholders.includes(s.id)}>
            <input type="checkbox" checked={stakeholders.includes(s.id)} on:change={() => toggleStakeholder(s.id)} />
            <span>{s.label}</span>
            {#if s.required}<Badge variant="warning" text="Required" />{/if}
          </label>
        {/each}
      </div>
    </div>

    <div class="phase__card">
      <h2>3. Define Project Scope</h2>
      <p class="phase__card-hint">What is the objective of the fraud alert triage project?</p>
      <textarea
        class="phase__textarea"
        bind:value={scopeStatement}
        placeholder="Describe the project scope, key deliverables, and success criteria..."
        rows="4"
      ></textarea>
    </div>

    <div class="phase__card">
      <h2>4. Identify Initial Risks</h2>
      <p class="phase__card-hint">What risks do you foresee? (One per line)</p>
      <textarea
        class="phase__textarea"
        bind:value={risks}
        placeholder="Regulatory timeline too aggressive&#10;Stakeholder availability limited&#10;Legacy system integration complexity"
        rows="4"
      ></textarea>
    </div>

    <div class="phase__actions">
      <Button variant="ghost" on:click={() => navigate('/project')}>Save & Exit</Button>
      <Button variant="primary" disabled={!canSubmit} on:click={completePhase}>
        {#if !p.started}Start Project{:else}Complete Initiation{/if}
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
  .phase__form { display: flex; flex-direction: column; gap: var(--space-6); }
  .phase__form--disabled { opacity: 0.5; pointer-events: none; }
  .phase__card { padding: var(--space-6); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-bg-surface); }
  .phase__card h2 { font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-2); }
  .phase__card-hint { font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-4); }

  .phase__role-options { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
  .phase__role-card { padding: var(--space-4); border: 2px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; display: flex; flex-direction: column; gap: var(--space-2); transition: border-color var(--transition-fast); }
  .phase__role-card:hover { border-color: var(--color-accent-secondary); }
  .phase__role-card--selected { border-color: var(--color-accent-primary); background: rgba(240, 136, 62, 0.06); }
  .phase__role-icon { font-size: 2rem; }
  .phase__role-name { font-weight: 600; }
  .phase__role-desc { font-size: var(--text-sm); color: var(--color-text-secondary); }

  .phase__stakeholder-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); }
  .phase__stakeholder-item { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer; font-size: var(--text-sm); }
  .phase__stakeholder-item--selected { border-color: var(--color-accent-secondary); background: rgba(88, 166, 255, 0.06); }

  .phase__textarea { width: 100%; background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-3); color: var(--color-text-primary); font-family: var(--font-body); font-size: var(--text-sm); resize: vertical; }
  .phase__textarea:focus { outline: none; border-color: var(--color-accent-secondary); }
  .phase__actions { display: flex; justify-content: space-between; padding-top: var(--space-4); }
</style>
