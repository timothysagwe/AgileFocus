<script>
  import { navigate } from '../../lib/router.js';
  import { project } from '../../lib/stores/project.js';
  import Button from '../../lib/components/Button.svelte';
  import Badge from '../../lib/components/Badge.svelte';
  import Card from '../../lib/components/Card.svelte';

  let auditResponses = '';
  let findingsIdentified = '';
  let remediationPlan = '';
  let evidenceReady = false;

  $: p = $project;
  $: completed = p.completed_phases?.includes('audit');
  $: canSubmit = auditResponses.length > 20 && findingsIdentified.length > 10;
  $: phaseState = project.getPhaseState('audit');
  $: crossState = phaseState.crossPhaseState;

  function completePhase() {
    const evidenceQuality = evidenceReady ? 80 : 30;
    const complianceScore = crossState.evidence_pack_status === 'complete' ? 85 : 40;
    const findingsCount = findingsIdentified.split('\n').filter(f => f.trim()).length;
    const breaches = crossState.compliance_breaches || 0;

    project.completePhase('audit', {
      evidence_quality: evidenceQuality,
      compliance_demonstration: complianceScore,
      findings_resolution: Math.min(100, findingsCount * 15),
      stakeholder_testimony: phaseState.trust.internal_auditor || 40,
      findings_count: findingsCount,
      compliance_breaches: breaches,
      overall_score: Math.round((evidenceQuality * 0.3 + complianceScore * 0.3 + Math.min(100, findingsCount * 15) * 0.25 + (phaseState.trust.internal_auditor || 40) * 0.15)),
      percentage: Math.round((evidenceQuality * 0.3 + complianceScore * 0.3 + Math.min(100, findingsCount * 15) * 0.25 + (phaseState.trust.internal_auditor || 40) * 0.15))
    }, {
      audit_responses: auditResponses.split('\n').filter(r => r.trim()),
      findings: findingsIdentified.split('\n').filter(f => f.trim()),
      remediation_plan: remediationPlan
    });
    navigate('/project');
  }
</script>

<div class="phase">
  <div class="phase__header">
    <button class="phase__back" on:click={() => navigate('/project')}>← Dashboard</button>
    <Badge variant="info" text="Phase 6 of 7" />
  </div>

  <h1 class="phase__title">Internal Audit</h1>
  <p class="phase__subtitle">Demonstrate compliance and respond to auditor queries.</p>

  {#if completed}
    <div class="phase__completed-banner">
      <p>✓ Audit complete. Proceed to the project retrospective.</p>
      <Button variant="primary" on:click={() => navigate('/project/retrospective')}>View Retrospective</Button>
    </div>
  {/if}

  <div class="phase__form" class:phase__form--disabled={completed}>
    <div class="phase__context">
      <Card>
        <h3>Audit Context</h3>
        <p>The internal auditor is reviewing your fraud alert triage project. They will assess:</p>
        <ul>
          <li>Evidence of regulatory compliance</li>
          <li>Quality of project documentation</li>
          <li>Stakeholder satisfaction</li>
          <li>Governance adherence</li>
        </ul>
        <div class="phase__context-stats">
          <div class="phase__context-stat">
            <span>Evidence Pack</span>
            <Badge variant={crossState.evidence_pack_status === 'complete' ? 'success' : 'warning'}
              text={crossState.evidence_pack_status === 'complete' ? 'Ready' : 'Incomplete'} />
          </div>
          <div class="phase__context-stat">
            <span>CAB Submitted</span>
            <Badge variant={crossState.cab_submitted ? 'success' : 'danger'}
              text={crossState.cab_submitted ? 'Yes' : 'No'} />
          </div>
        </div>
      </Card>
    </div>

    <div class="phase__card">
      <h2>1. Auditor Queries</h2>
      <p class="phase__card-hint">Respond to the auditor's request for evidence. Explain how you've demonstrated regulatory compliance throughout the project.</p>
      <textarea
        class="phase__textarea"
        bind:value={auditResponses}
        placeholder="Describe your compliance evidence:&#10;- FCA SYSC requirements met through...&#10;- PRA outsourcing requirements addressed by...&#10;- Audit trail maintained via..."
        rows="5"
      ></textarea>
    </div>

    <div class="phase__card">
      <h2>2. Identify Findings</h2>
      <p class="phase__card-hint">What findings or observations do you anticipate the auditor might raise? (One per line)</p>
      <textarea
        class="phase__textarea"
        bind:value={findingsIdentified}
        placeholder="Incomplete evidence pack for sprint 3 deployment&#10;Risk register not updated for new regulations&#10;Stakeholder sign-off missing for requirements"
        rows="4"
      ></textarea>
    </div>

    <div class="phase__card">
      <h2>3. Remediation Plan</h2>
      <p class="phase__card-hint">How will you address any findings raised?</p>
      <textarea
        class="phase__textarea"
        bind:value={remediationPlan}
        placeholder="Describe your remediation approach..."
        rows="4"
      ></textarea>
    </div>

    <div class="phase__card">
      <label class="phase__checkbox">
        <input type="checkbox" bind:checked={evidenceReady} />
        <span>Evidence pack is complete and ready for auditor review</span>
      </label>
    </div>

    <div class="phase__actions">
      <Button variant="ghost" on:click={() => navigate('/project')}>Back to Dashboard</Button>
      <Button variant="primary" disabled={!canSubmit} on:click={completePhase}>Complete Audit</Button>
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
  .phase__context h3 { font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-2); }
  .phase__context ul { margin: var(--space-2) 0; padding-left: var(--space-5); font-size: var(--text-sm); color: var(--color-text-secondary); }
  .phase__context ul li { margin-bottom: var(--space-1); }
  .phase__context-stats { display: flex; gap: var(--space-4); margin-top: var(--space-3); }
  .phase__context-stat { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); }
  .phase__card { padding: var(--space-6); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-bg-surface); }
  .phase__card h2 { font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-2); }
  .phase__card-hint { font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-4); }
  .phase__textarea { width: 100%; background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-3); color: var(--color-text-primary); font-family: var(--font-body); font-size: var(--text-sm); resize: vertical; }
  .phase__textarea:focus { outline: none; border-color: var(--color-accent-secondary); }
  .phase__checkbox { display: flex; align-items: center; gap: var(--space-3); cursor: pointer; font-size: var(--text-sm); }
  .phase__actions { display: flex; justify-content: space-between; padding-top: var(--space-4); }
</style>
