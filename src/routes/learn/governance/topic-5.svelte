<script>
  import { navigate } from '../../../lib/router.js';
  import { progress } from '../../../lib/stores/progress.js';
  import Card from '../../../lib/components/Card.svelte';
  import Badge from '../../../lib/components/Badge.svelte';
  import Button from '../../../lib/components/Button.svelte';
  import FeatureGate from '../../../lib/components/FeatureGate.svelte';
  import { getDefaultClient } from '../../../lib/engines/byok-client.js';

  const moduleKey = 'governance-topic-5';
  $: isComplete = ($progress.completed_modules || []).includes(moduleKey);

  const availableArtefacts = [
    { id: 'sprint-backlog', label: 'Sprint backlog (stories, tasks, assignments)', category: 'planning', essential: true },
    { id: 'definition-of-done', label: 'Definition of Done with regulatory addenda', category: 'governance', essential: true },
    { id: 'acceptance-criteria', label: 'Acceptance criteria (per story)', category: 'requirements', essential: true },
    { id: 'test-results', label: 'Test results (unit, integration, regression)', category: 'testing', essential: true },
    { id: 'security-scan-report', label: 'Security scan report for PCI-DSS scope', category: 'security', essential: true },
    { id: 'audit-log-export', label: 'Audit log export (user actions, timestamps)', category: 'evidence', essential: true },
    { id: 'sprint-review-minutes', label: 'Sprint review minutes and demo recordings', category: 'ceremonies', essential: false },
    { id: 'cab-submission', label: 'CAB submission and approval record', category: 'governance', essential: true },
    { id: 'rollback-plan', label: 'Rollback plans for production changes', category: 'operations', essential: true },
    { id: 'velocity-chart', label: 'Velocity chart and capacity data', category: 'metrics', essential: false },
    { id: 'team-retro-notes', label: 'Team retrospective notes', category: 'ceremonies', essential: false },
    { id: 'risk-register', label: 'Risk register entries for the sprint', category: 'governance', essential: true },
    { id: 'incident-log', label: 'Incident log (if any incidents occurred)', category: 'operations', essential: false },
    { id: 'traceability-matrix', label: 'Traceability matrix (story to obligation)', category: 'evidence', essential: true },
    { id: 'stakeholder-comm', label: 'Stakeholder communications and status reports', category: 'communications', essential: false }
  ];

  let selectedIds = ['sprint-backlog', 'definition-of-done', 'test-results', 'audit-log-export', 'cab-submission', 'risk-register', 'traceability-matrix'];
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
      const submission = availableArtefacts.filter(a => selectedIds.includes(a.id)).map(a => a.label);
      const rubricResult = { score, passed: score >= 70 };
      const feedback = await byokClient.getGovernanceFeedback('topic-5', submission, rubricResult);
      if (feedback) aiFeedback = feedback;
    }
    aiFeedbackLoading = false;
  }

  function toggleArtefact(id) {
    if (selectedIds.includes(id)) {
      selectedIds = selectedIds.filter(s => s !== id);
    } else {
      selectedIds = [...selectedIds, id];
    }
  }

  function submitExercise() {
    feedbackItems = [];
    const selected = availableArtefacts.filter(a => selectedIds.includes(a.id));
    const missingEssential = availableArtefacts.filter(a => a.essential && !selectedIds.includes(a.id));
    const categories = [...new Set(selected.map(s => s.category))];

    let s = 0;
    if (missingEssential.length === 0) {
      s += 50;
    } else {
      feedbackItems.push(`Missing essential artefact(s): ${missingEssential.map(m => m.label).join(', ')}`);
    }
    if (categories.length >= 5) {
      s += 30;
    } else {
      feedbackItems.push(`Cover at least 5 artefact categories (have ${categories.length})`);
    }
    if (selected.length >= 8) {
      s += 20;
    } else {
      feedbackItems.push(`Select at least 8 artefacts (have ${selected.length})`);
    }

    score = s;
    submitted = true;

    if (s >= 70) {
      progress.update(p => ({
        ...p,
        completed_modules: [...new Set([...p.completed_modules, moduleKey])]
      }));
    }
  }

  function downloadEvidencePack() {
    const selected = availableArtefacts.filter(a => selectedIds.includes(a.id));
    const byCategory = {};
    for (const a of selected) {
      if (!byCategory[a.category]) byCategory[a.category] = [];
      byCategory[a.category].push(a.label);
    }

    const auditTemplate = 'Audit Evidence Pack — Sprint Artefact Review\n';
    const content = auditTemplate + `===============================================
Project: Fraud Alert Triage System (Meridian Bank)
Prepared for: Internal Audit Review
Generated: ${new Date().toISOString()}

--- Artefact Inventory ---
${Object.entries(byCategory).map(([cat, items]) => `\n[${cat.toUpperCase()}]\n${items.map(i => '  [x] ' + i).join('\n')}`).join('\n')}

--- Audit Questions ---
Q1: Are all regulatory requirements traceable to test evidence?
A1: ${selectedIds.includes('traceability-matrix') ? 'Yes — traceability matrix included.' : 'Not fully addressed.'}

Q2: Is there evidence of security review for PCI-DSS scope?
A2: ${selectedIds.includes('security-scan-report') ? 'Yes — security scan report included.' : 'Not included in this pack.'}

Q3: Are change approvals documented?
A3: ${selectedIds.includes('cab-submission') ? 'Yes — CAB submission and approval included.' : 'Not included in this pack.'}

Q4: Is there an audit trail of user actions?
A4: ${selectedIds.includes('audit-log-export') ? 'Yes — audit log export included.' : 'Not included in this pack.'}

--- Assessment ---
Score: ${score}/100
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'evidence-pack-' + Date.now() + '.txt';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="topic">
  <div class="topic__nav">
    <button class="topic__back" on:click={() => navigate('/learn/governance')}>&larr; Governance Module</button>
    <Badge variant="level" text="Topic 5" />
    {#if isComplete}
      <Badge variant="success" text="Complete" />
    {/if}
  </div>

  <h1>Evidence Packs for Internal Audit</h1>
  <p class="topic__estimate">Estimated time: 40 minutes</p>

  <section class="topic__section">
    <h2>What Internal Audit Looks For</h2>
    <p>Internal audit in financial services operates under the "Three Lines of Defence" model. Audit is the third line. They look for evidence that controls exist and are operating effectively. In an Agile project, this means they want to see: (1) that requirements are traceable, (2) that testing was performed and passed, (3) that security reviews happened, (4) that changes were approved through the correct governance process, and (5) that there is an audit trail of who did what and when.</p>
  </section>

  <section class="topic__section">
    <h2>The Evidence Pack Concept</h2>
    <p>An evidence pack is a curated collection of artefacts that demonstrates control effectiveness for a specific scope (sprint, release, or programme). It is not the same as project documentation. Project documentation exists to help the team deliver; evidence exists to prove to an external party that controls operated correctly. The distinction matters: a team's Slack conversation about a decision is not evidence. A signed-off decision record is. Build the evidence pack as you go — retroactively assembling 6 months of evidence is painful and often incomplete.</p>
  </section>

  <section class="topic__section">
    <h2>Sprint-Level vs Programme-Level Evidence</h2>
    <ul>
      <li><strong>Sprint-level:</strong> Sprint backlog, DoD, acceptance criteria, test results, sprint review minutes, CAB submission if applicable. Capture these every sprint.</li>
      <li><strong>Programme-level:</strong> Traceability matrix, risk register, governance approvals, security assessment, audit trail exports. Assemble at key milestones (before an audit gate or regulatory submission).</li>
    </ul>
  </section>

  <section class="topic__section">
    <h2>Common Audit Findings</h2>
    <p>The most common audit findings in Agile programmes are: (1) no evidence of security review before deployment, (2) untraceable regulatory requirements, (3) missing or inadequate rollback plans, (4) verbal approvals with no written record, (5) incomplete audit trails. All five are preventable by design — embed evidence capture into your DoD and sprint ceremonies.</p>
  </section>

  <section class="topic__section">
    <h2>Practical Exercise: Assemble an Evidence Pack</h2>
    <p>Select the artefacts you would include in an audit evidence pack for a sprint. Consider what an auditor would need to verify controls were operating:</p>

    <div class="exercise">
      <div class="exercise__artefacts">
        {#each availableArtefacts as artefact (artefact.id)}
          <label class="exercise__artefact" class:exercise__artefact--selected={selectedIds.includes(artefact.id)} class:exercise__artefact--essential={artefact.essential}>
            <input type="checkbox" checked={selectedIds.includes(artefact.id)} on:change={() => toggleArtefact(artefact.id)} />
            <div class="exercise__artefact-info">
              <span class="exercise__artefact-label">{artefact.label}</span>
              <span class="exercise__artefact-cat">{artefact.category}</span>
              {#if artefact.essential}
                <Badge variant="warning" text="Essential" />
              {/if}
            </div>
          </label>
        {/each}
      </div>

      <div class="exercise__actions">
        <Button variant="primary" on:click={submitExercise}>Submit &amp; Score</Button>
        {#if submitted}
          <Button variant="secondary" on:click={downloadEvidencePack}>Download Evidence Pack</Button>
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
            <p>All essential artefacts selected. Strong organisational coverage.</p>
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
  .exercise { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-4); }
  .exercise__artefacts { display: flex; flex-direction: column; gap: var(--space-2); }
  .exercise__artefact { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; transition: border-color var(--transition-fast); }
  .exercise__artefact:hover { border-color: var(--color-text-secondary); }
  .exercise__artefact--selected { border-color: var(--color-accent-primary); background: rgba(240, 136, 62, 0.05); }
  .exercise__artefact--essential { border-left: 3px solid var(--color-accent-warning); }
  .exercise__artefact input { accent-color: var(--color-accent-primary); }
  .exercise__artefact-info { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
  .exercise__artefact-label { font-size: var(--text-sm); }
  .exercise__artefact-cat { font-size: var(--text-xs); color: var(--color-text-secondary); background: var(--color-bg-surface); padding: 1px var(--space-1); border-radius: var(--radius-sm); text-transform: uppercase; letter-spacing: 0.03em; }
  .exercise__actions { display: flex; gap: var(--space-3); }
  .exercise__result h3 { font-size: var(--text-lg); margin-bottom: var(--space-2); }
  .exercise__feedback { display: flex; flex-direction: column; gap: var(--space-1); padding-left: var(--space-4); }
  .exercise__feedback li { font-size: var(--text-sm); color: var(--color-accent-warning); }
  .exercise__ai-loading { font-size: var(--text-sm); color: var(--color-accent-secondary); padding: var(--space-2) 0; }
  .exercise__ai-text { font-size: var(--text-sm); line-height: 1.6; color: var(--color-text-secondary); white-space: pre-wrap; }
</style>
