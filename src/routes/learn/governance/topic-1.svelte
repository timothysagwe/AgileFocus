<script>
  import { navigate } from '../../../lib/router.js';
  import { progress } from '../../../lib/stores/progress.js';
  import Card from '../../../lib/components/Card.svelte';
  import Badge from '../../../lib/components/Badge.svelte';
  import Button from '../../../lib/components/Button.svelte';
  import FeatureGate from '../../../lib/components/FeatureGate.svelte';
  import { getDefaultClient } from '../../../lib/engines/byok-client.js';

  const moduleKey = 'governance-topic-1';
  $: isComplete = ($progress.completed_modules || []).includes(moduleKey);

  let changeDescription = '';
  let impactAssessment = '';
  let rollbackPlan = '';
  let testEvidence = '';
  let approvalChain = '';
  let submitted = false;
  let score = 0;
  let feedbackItems = [];
  let aiFeedback = '';
  let aiFeedbackLoading = false;

  async function loadAIFeedback() {
    if (aiFeedbackLoading || aiFeedback) return;
    aiFeedbackLoading = true;
    const byokClient = getDefaultClient();
    if (byokClient?.isAvailable()) {
      const submission = { changeDescription, impactAssessment, rollbackPlan, testEvidence, approvalChain };
      const rubricResult = { score, passed: score >= 60 };
      const feedback = await byokClient.getGovernanceFeedback('topic-1', submission, rubricResult);
      if (feedback) aiFeedback = feedback;
    }
    aiFeedbackLoading = false;
  }

  function submitExercise() {
    feedbackItems = [];
    let s = 0;

    if (changeDescription.trim().length >= 20) { s += 20; } else { feedbackItems.push('Change description is too short (min 20 chars)'); }
    if (impactAssessment.trim().length >= 20) { s += 20; } else { feedbackItems.push('Impact assessment needs more detail'); }
    if (rollbackPlan.trim().length >= 15) { s += 20; } else { feedbackItems.push('Rollback plan is missing or too brief'); }
    if (testEvidence.trim().length >= 15) { s += 20; } else { feedbackItems.push('Test evidence not referenced'); }
    if (approvalChain.trim().length >= 10) { s += 20; } else { feedbackItems.push('Approval chain is incomplete'); }

    score = s;
    submitted = true;

    if (s >= 60) {
      progress.update(p => ({
        ...p,
        completed_modules: [...new Set([...p.completed_modules, moduleKey])]
      }));
    }
  }

  function downloadSubmission() {
    const sprintSummary = 'Sprint completed: Fraud alert triage — alert queue, actioning workflow, PCI-DSS masking, audit logging';
    const content = `CAB Submission — Sprint Release Package
========================================
Project: Fraud Alert Triage System
Sprint: 3 (PCI-DSS Compliance Sprint)
Prepared by: [BA Name]
Date: ${new Date().toLocaleDateString()}

--- Sprint Summary ---
${sprintSummary}

--- Change Description ---
${changeDescription}

--- Impact Assessment ---
${impactAssessment}

--- Rollback Plan ---
${rollbackPlan}

--- Test Evidence ---
${testEvidence}

--- Approval Chain ---
${approvalChain}

--- Submission Meta ---
Status: ${score >= 60 ? 'PASS' : 'NEEDS REVISION'}
Score: ${score}/100
Submitted: ${new Date().toISOString()}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cab-submission-sprint-' + Date.now() + '.txt';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="topic">
  <div class="topic__nav">
    <button class="topic__back" on:click={() => navigate('/learn/governance')}>&larr; Governance Module</button>
    <Badge variant="level" text="Topic 1" />
    {#if isComplete}
      <Badge variant="success" text="Complete" />
    {/if}
  </div>

  <h1>Running Agile inside a CAB Framework</h1>
  <p class="topic__estimate">Estimated time: 30 minutes</p>

  <section class="topic__section">
    <h2>What is a Change Advisory Board?</h2>
    <p>A Change Advisory Board (CAB) is a governance body that reviews, approves, or rejects changes to production IT systems. In UK financial services, CABs are typically mandated by ITIL-based change management policies that originate from FCA and PRA requirements for controlled change. A CAB includes representatives from risk, security, operations, and sometimes compliance. Their role is to assess the risk of each change and ensure appropriate controls are in place before any production deployment.</p>
  </section>

  <section class="topic__section">
    <h2>The Agile Tension</h2>
    <p>Agile values "working software over comprehensive documentation." CABs require documentation before approving a change. This creates a structural tension. Agile teams deliver incrementally and frequently. CABs operate on scheduled meetings with submission deadlines. The solution is <strong>not</strong> to fight the CAB — it is to treat the CAB as a stakeholder with a Definition of Done requirement. Just as you would not ship a story without passing tests, you should not production-deploy without passing CAB review. The CAB becomes part of your DoD, not an external blocker.</p>
  </section>

  <section class="topic__section">
    <h2>CAB Submission Structure</h2>
    <p>A standard CAB submission in a regulated environment requires five components:</p>
    <ul>
      <li><strong>Change Description</strong> — What changed, why, and what systems are affected</li>
      <li><strong>Impact Assessment</strong> — Risk rating, customer impact, regulatory implications</li>
      <li><strong>Rollback Plan</strong> — How to revert if the change causes issues</li>
      <li><strong>Test Evidence</strong> — What testing was done and the results</li>
      <li><strong>Approval Chain</strong> — Who has already reviewed and approved</li>
    </ul>
  </section>

  <section class="topic__section">
    <h2>Change Freeze Windows</h2>
    <p>Financial services operate change freezes around month-end, quarter-end, and year-end processing. These are non-negotiable. Agile teams must plan sprints around them: sprint 1-2 of a quarter before the freeze, sprint 3 during the freeze (non-production work), sprint 4 after the freeze opens. The emergency change process exists for regulatory stories that cannot wait, but it requires explicit senior management sponsorship and a compelling justification.</p>
  </section>

  <section class="topic__section">
    <h2>Practical Exercise: Build a CAB Submission</h2>
    <p>Given the following sprint summary, fill in the structured form to create a CAB submission package:</p>
    <Card>
      <p class="topic__scenario"><strong>Sprint Summary:</strong> Sprint 3 of your fraud alert triage project. You delivered PCI-DSS card data masking, audit logging, and alert timestamp logging. The Risk Manager has approved the compliance aspects. The CAB meets in 3 days. Prepare your submission.</p>
    </Card>

    <div class="exercise">
      <div class="exercise__field">
        <label for="changeDesc">Change Description</label>
        <textarea id="changeDesc" bind:value={changeDescription} rows="3" placeholder="Describe what changed, why, and affected systems..."></textarea>
      </div>
      <div class="exercise__field">
        <label for="impact">Impact Assessment</label>
        <textarea id="impact" bind:value={impactAssessment} rows="3" placeholder="Risk rating, customer impact, regulatory implications..."></textarea>
      </div>
      <div class="exercise__field">
        <label for="rollback">Rollback Plan</label>
        <textarea id="rollback" bind:value={rollbackPlan} rows="2" placeholder="How to revert if this causes issues..."></textarea>
      </div>
      <div class="exercise__field">
        <label for="testEvidence">Test Evidence</label>
        <textarea id="testEvidence" bind:value={testEvidence} rows="2" placeholder="What testing was done and results..."></textarea>
      </div>
      <div class="exercise__field">
        <label for="approvalChain">Approval Chain</label>
        <textarea id="approvalChain" bind:value={approvalChain} rows="2" placeholder="Who reviewed and approved..."></textarea>
      </div>

      <div class="exercise__actions">
        <Button variant="primary" on:click={submitExercise}>Submit &amp; Score</Button>
        {#if submitted}
          <Button variant="secondary" on:click={downloadSubmission}>Download CAB Submission</Button>
        {/if}
      </div>
    </div>

    {#if submitted}
      <Card variant={score >= 60 ? 'success' : 'warning'}>
        <div class="exercise__result">
          <h3>Score: {score}/100 {score >= 60 ? '— Pass' : '— Needs Revision'}</h3>
          {#if feedbackItems.length > 0}
            <ul class="exercise__feedback">
              {#each feedbackItems as item}
                <li>{item}</li>
              {/each}
            </ul>
          {:else}
            <p>All criteria met. Strong submission.</p>
          {/if}
        </div>
      </Card>
      <FeatureGate>
        <div slot="ai">
          {#if aiFeedbackLoading}
            <p class="exercise__ai-loading">Generating AI coaching feedback...</p>
          {:else if aiFeedback}
            <Card variant="info">
              <h3>AI Coaching Feedback</h3>
              <p class="exercise__ai-text">{aiFeedback}</p>
            </Card>
          {:else}
            <Button variant="ghost" size="sm" on:click={loadAIFeedback}>Get AI Coaching</Button>
          {/if}
        </div>
        <div slot="fallback"></div>
      </FeatureGate>
    {/if}
  </section>
</div>

<style>
  .topic { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-6); }
  .topic__nav { display: flex; align-items: center; gap: var(--space-3); }
  .topic__back { background: none; border: none; color: var(--color-text-secondary); cursor: pointer; font-family: var(--font-body); font-size: var(--text-sm); padding: 0; }
  .topic__back:hover { color: var(--color-text-primary); }
  .topic__estimate { font-size: var(--text-sm); color: var(--color-text-secondary); }
  .topic__section { display: flex; flex-direction: column; gap: var(--space-3); }
  .topic__section h2 { font-size: var(--text-xl); margin-top: var(--space-2); }
  .topic__section p, .topic__section li { font-size: var(--text-sm); line-height: 1.7; color: var(--color-text-secondary); }
  .topic__section ul { padding-left: var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
  .topic__section li strong { color: var(--color-text-primary); }
  .topic__scenario { font-size: var(--text-sm) !important; line-height: 1.6; padding: var(--space-2) 0; }
  .exercise { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-4); }
  .exercise__field { display: flex; flex-direction: column; gap: var(--space-1); }
  .exercise__field label { font-size: var(--text-sm); font-weight: 600; }
  .exercise__field textarea { background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: var(--space-3); color: var(--color-text-primary); font-family: var(--font-body); font-size: var(--text-sm); resize: vertical; }
  .exercise__field textarea:focus { outline: 2px solid var(--color-accent-secondary); outline-offset: -1px; }
  .exercise__actions { display: flex; gap: var(--space-3); }
  .exercise__result h3 { font-size: var(--text-lg); margin-bottom: var(--space-2); }
  .exercise__feedback { display: flex; flex-direction: column; gap: var(--space-1); padding-left: var(--space-4); }
  .exercise__feedback li { font-size: var(--text-sm); color: var(--color-accent-warning); }
  .exercise__ai-loading { font-size: var(--text-sm); color: var(--color-accent-secondary); padding: var(--space-2) 0; }
  .exercise__ai-text { font-size: var(--text-sm); line-height: 1.6; color: var(--color-text-secondary); white-space: pre-wrap; }
</style>
