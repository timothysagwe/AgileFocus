<script>
  import { navigate } from '../../../lib/router.js';
  import { progress } from '../../../lib/stores/progress.js';
  import Card from '../../../lib/components/Card.svelte';
  import Badge from '../../../lib/components/Badge.svelte';
  import Button from '../../../lib/components/Button.svelte';
  import FeatureGate from '../../../lib/components/FeatureGate.svelte';
  import { getDefaultClient } from '../../../lib/engines/byok-client.js';

  const moduleKey = 'governance-topic-2';
  $: isComplete = ($progress.completed_modules || []).includes(moduleKey);

  const allItems = [
    { id: 'code-complete', category: 'functional', label: 'Code complete and peer reviewed', defaultOn: true },
    { id: 'unit-tests', category: 'functional', label: 'Unit tests written and passing', defaultOn: true },
    { id: 'integration-tests', category: 'functional', label: 'Integration tests passing', defaultOn: true },
    { id: 'acceptance-tests', category: 'functional', label: 'Acceptance criteria met', defaultOn: true },
    { id: 'security-scan', category: 'security', label: 'Security vulnerability scan passed', defaultOn: false },
    { id: 'pen-test', category: 'security', label: 'Penetration testing completed for PCI-DSS scope', defaultOn: false },
    { id: 'access-review', category: 'security', label: 'Access control review completed', defaultOn: false },
    { id: 'data-masking', category: 'compliance', label: 'PCI-DSS data masking verified', defaultOn: false },
    { id: 'audit-log', category: 'compliance', label: 'Audit trail captured for all changes', defaultOn: false },
    { id: 'controls-signoff', category: 'compliance', label: 'Controls sign-off obtained from Risk', defaultOn: false },
    { id: 'reg-check', category: 'compliance', label: 'Regulatory compliance checklist completed', defaultOn: false },
    { id: 'evidence-sprint', category: 'audit', label: 'Sprint evidence captured for audit trail', defaultOn: false },
    { id: 'traceability', category: 'audit', label: 'Story-to-requirement traceability verified', defaultOn: false },
    { id: 'doc-reviewed', category: 'audit', label: 'Documentation reviewed and versioned', defaultOn: false }
  ];

  let checklist = allItems.map(i => ({ ...i, checked: i.defaultOn }));
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
      const submission = checklist.filter(i => i.checked).map(i => i.label);
      const rubricResult = { score, passed: score >= 70 };
      const feedback = await byokClient.getGovernanceFeedback('topic-2', submission, rubricResult);
      if (feedback) aiFeedback = feedback;
    }
    aiFeedbackLoading = false;
  }

  $: categoryCounts = allItems.reduce((acc, i) => {
    acc[i.category] = (acc[i.category] || 0) + 1;
    return acc;
  }, {});

  $: checkedByCategory = allItems.reduce((acc, i) => {
    if (!acc[i.category]) acc[i.category] = { checked: 0, total: 0 };
    acc[i.category].total++;
    const item = checklist.find(c => c.id === i.id);
    if (item && item.checked) acc[i.category].checked++;
    return acc;
  }, {});

  function toggleItem(id) {
    checklist = checklist.map(i => i.id === id ? { ...i, checked: !i.checked } : i);
  }

  function submitExercise() {
    feedbackItems = [];
    const cats = { functional: 0, security: 0, compliance: 0, audit: 0 };
    for (const item of checklist) {
      if (item.checked) cats[item.category] = (cats[item.category] || 0) + 1;
    }

    let s = 0;
    if (cats.functional >= 3) { s += 25; } else { feedbackItems.push('Select at least 3 functional items'); }
    if (cats.security >= 2) { s += 25; } else { feedbackItems.push('Select at least 2 security review items'); }
    if (cats.compliance >= 3) { s += 25; } else { feedbackItems.push('Select at least 3 compliance items'); }
    if (cats.audit >= 2) { s += 25; } else { feedbackItems.push('Select at least 2 audit trail items'); }

    score = s;
    submitted = true;

    if (s >= 70) {
      progress.update(p => ({
        ...p,
        completed_modules: [...new Set([...p.completed_modules, moduleKey])]
      }));
    }
  }

  function downloadDoD() {
    const checked = checklist.filter(i => i.checked);
    const content = `Definition of Done — PCI-DSS Scoped Sprint
=========================================
Generated: ${new Date().toISOString()}

Functional Items:
${checked.filter(i => i.category === 'functional').map(i => '  [x] ' + i.label).join('\n')}

Security Review Items:
${checked.filter(i => i.category === 'security').map(i => '  [x] ' + i.label).join('\n')}

Compliance Items:
${checked.filter(i => i.category === 'compliance').map(i => '  [x] ' + i.label).join('\n')}

Audit Trail Items:
${checked.filter(i => i.category === 'audit').map(i => '  [x] ' + i.label).join('\n')}

Score: ${score}/100
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dod-checklist-pci-dss-' + Date.now() + '.txt';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="topic">
  <div class="topic__nav">
    <button class="topic__back" on:click={() => navigate('/learn/governance')}>&larr; Governance Module</button>
    <Badge variant="level" text="Topic 2" />
    {#if isComplete}
      <Badge variant="success" text="Complete" />
    {/if}
  </div>

  <h1>Definition of Done in Controlled Environments</h1>
  <p class="topic__estimate">Estimated time: 25 minutes</p>

  <section class="topic__section">
    <h2>Why Standard DoD is Insufficient</h2>
    <p>A standard Agile DoD (code complete, tests pass, peer reviewed) is designed for unregulated contexts. In financial services and government, second-line risk functions require additional controls before code can be considered "done." Code that passes unit tests but has not been security-scanned, does not have an audit trail, and has not been signed off by controls is <strong>not done</strong> in a regulated sense — it is merely written. The distinction matters because regulators hold the firm accountable for what was deployed, not what was coded.</p>
  </section>

  <section class="topic__section">
    <h2>The Three Additional Layers</h2>
    <ul>
      <li><strong>Controls Sign-Off:</strong> A risk or compliance representative must explicitly confirm that the story meets regulatory requirements before it can be marked done. This is not optional — it is a control gate.</li>
      <li><strong>Security Review:</strong> For PCI-DSS scoped stories, security review is a regulatory requirement, not a quality nicety. The security review must be documented, not verbal.</li>
      <li><strong>Audit Trail Requirement:</strong> Every story must have a traceable path from requirement to test evidence to production deployment. Without this, an auditor will flag it.</li>
    </ul>
  </section>

  <section class="topic__section">
    <h2>Negotiating DoD with Risk Functions</h2>
    <p>Risk managers and compliance officers are often unfamiliar with Agile. They may ask for Gantt charts, stage gates, and signed-off requirements documents. The BA's role is to translate: show them the sprint board as a control framework, explain that the DoD is the stage gate, and demonstrate how each story's acceptance criteria maps to their control requirements. Do not dismiss their concerns — incorporate them into the DoD. A DoD that satisfies both the team and second-line defence is the hallmark of regulated Agile maturity.</p>
  </section>

  <section class="topic__section">
    <h2>Velocity Impact</h2>
    <p>A regulated DoD typically reduces velocity by 15-30% compared to a standard DoD. This is not a team performance issue — it is the cost of compliance. Plan for it. If your team's historical velocity is 40 points per sprint with a standard DoD, expect 28-34 points with a regulated DoD. The BA should factor this into release planning and set stakeholder expectations accordingly. <strong>Do not</strong> pressure the team to skip compliance steps to "make velocity." That is how regulatory breaches happen.</p>
  </section>

  <section class="topic__section">
    <h2>Practical Exercise: Build a Regulated DoD</h2>
    <p>Build a Definition of Done checklist for a PCI-DSS scoped sprint. Select items from each category to create a complete regulated DoD:</p>

    <div class="exercise">
      {#each Object.entries(checkedByCategory) as [category, counts]}
        <div class="exercise__category">
          <h3>{category}</h3>
          <span class="exercise__count">{counts.checked}/{counts.total} selected</span>
          {#each checklist.filter(i => i.category === category) as item}
            <label class="exercise__check">
              <input type="checkbox" checked={item.checked} on:change={() => toggleItem(item.id)} />
              <span>{item.label}</span>
            </label>
          {/each}
        </div>
      {/each}

      <div class="exercise__actions">
        <Button variant="primary" on:click={submitExercise}>Submit &amp; Score</Button>
        {#if submitted}
          <Button variant="secondary" on:click={downloadDoD}>Download DoD Checklist</Button>
        {/if}
      </div>
    </div>

    {#if submitted}
      <Card variant={score >= 70 ? 'success' : 'warning'}>
        <div class="exercise__result">
          <h3>Score: {score}/100 {score >= 70 ? '— Pass' : '— Needs Revision'}</h3>
          {#if feedbackItems.length > 0}
            <ul class="exercise__feedback">
              {#each feedbackItems as item}
                <li>{item}</li>
              {/each}
            </ul>
          {:else}
            <p>Excellent. Your DoD covers all regulated categories.</p>
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
  .exercise { display: flex; flex-direction: column; gap: var(--space-6); margin-top: var(--space-4); }
  .exercise__category { display: flex; flex-direction: column; gap: var(--space-2); }
  .exercise__category h3 { font-size: var(--text-base); text-transform: capitalize; display: flex; align-items: center; gap: var(--space-2); }
  .exercise__count { font-size: var(--text-xs); color: var(--color-text-secondary); font-family: var(--font-display); }
  .exercise__check { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); cursor: pointer; padding: var(--space-1) 0; }
  .exercise__check input { accent-color: var(--color-accent-primary); }
  .exercise__check span { color: var(--color-text-secondary); }
  .exercise__check input:checked + span { color: var(--color-text-primary); }
  .exercise__actions { display: flex; gap: var(--space-3); }
  .exercise__result h3 { font-size: var(--text-lg); margin-bottom: var(--space-2); }
  .exercise__feedback { display: flex; flex-direction: column; gap: var(--space-1); padding-left: var(--space-4); }
  .exercise__feedback li { font-size: var(--text-sm); color: var(--color-accent-warning); }
  .exercise__ai-loading { font-size: var(--text-sm); color: var(--color-accent-secondary); padding: var(--space-2) 0; }
  .exercise__ai-text { font-size: var(--text-sm); line-height: 1.6; color: var(--color-text-secondary); white-space: pre-wrap; }
</style>
