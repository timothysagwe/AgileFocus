<script>
  import { navigate } from '../../../lib/router.js';
  import { progress } from '../../../lib/stores/progress.js';
  import Card from '../../../lib/components/Card.svelte';
  import Badge from '../../../lib/components/Badge.svelte';
  import Button from '../../../lib/components/Button.svelte';
  import FeatureGate from '../../../lib/components/FeatureGate.svelte';
  import { getDefaultClient } from '../../../lib/engines/byok-client.js';

  const moduleKey = 'governance-topic-3';
  $: isComplete = ($progress.completed_modules || []).includes(moduleKey);

  const stories = [
    { id: 'alert-queue', title: 'View alert queue', type: 'regulatory', obligation: 'FCA Consumer Duty — timely handling' },
    { id: 'action-alert', title: 'Action an alert', type: 'business', obligation: '' },
    { id: 'alert-logging', title: 'Alerts logged with timestamp', type: 'regulatory', obligation: 'FCA SYSC — audit trail' },
    { id: 'alert-thresholds', title: 'Configure alert thresholds', type: 'business', obligation: '' },
    { id: 'case-notes', title: 'Add case notes', type: 'business', obligation: '' },
    { id: 'pci-masking', title: 'PCI-DSS card data masking', type: 'regulatory', obligation: 'PCI-DSS 3.4 — cardholder data protection' },
    { id: 'escalate-alert', title: 'Escalate alerts to senior review', type: 'regulatory', obligation: 'FCA Consumer Duty — vulnerable customer treatment' },
    { id: 'audit-log', title: 'User actions audit logged', type: 'regulatory', obligation: 'FCA SYSC — audit trail / PCI-DSS 10.2' }
  ];

  const regulatoryObligations = [
    { id: 'fca-consumer-duty', label: 'FCA Consumer Duty — timely handling' },
    { id: 'fca-sysc-audit', label: 'FCA SYSC — audit trail' },
    { id: 'pci-dss-34', label: 'PCI-DSS 3.4 — cardholder data protection' },
    { id: 'pci-dss-102', label: 'PCI-DSS 10.2 — audit trail' },
    { id: 'fca-vulnerable', label: 'FCA Consumer Duty — vulnerable customer treatment' },
    { id: 'business-req', label: 'Business requirement (no regulatory mapping)' }
  ];

  let traceMatrix = stories.map(s => ({
    storyId: s.id,
    title: s.title,
    type: s.type,
    mappedObligation: s.type === 'regulatory' ? s.obligation : ''
  }));

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
      const rubricResult = { score, passed: score >= 70 };
      const feedback = await byokClient.getGovernanceFeedback('topic-3', traceMatrix, rubricResult);
      if (feedback) aiFeedback = feedback;
    }
    aiFeedbackLoading = false;
  }

  function setObligation(storyId, value) {
    traceMatrix = traceMatrix.map(t => t.storyId === storyId ? { ...t, mappedObligation: value } : t);
  }

  function submitExercise() {
    feedbackItems = [];
    let s = 0;
    const regStories = traceMatrix.filter(t => t.type === 'regulatory');
    const mappedReg = regStories.filter(t => t.mappedObligation && t.mappedObligation !== 'Business requirement (no regulatory mapping)');
    const allMapped = traceMatrix.filter(t => t.mappedObligation.length > 0);

    if (mappedReg.length === regStories.length) { s += 50; } else { feedbackItems.push(`Map ${regStories.length - mappedReg.length} regulatory story(ies) to an obligation`); }
    if (allMapped.length === traceMatrix.length) { s += 30; } else { feedbackItems.push(`${traceMatrix.length - allMapped.length} story(ies) have no trace — add obligation or mark as business requirement`); }
    const hasBusiness = traceMatrix.filter(t => t.type === 'business' && t.mappedObligation === 'Business requirement (no regulatory mapping)');
    if (hasBusiness.length > 0) { s += 20; } else { feedbackItems.push('Business stories should reference "Business requirement (no regulatory mapping)"'); }

    score = s;
    submitted = true;

    if (s >= 70) {
      progress.update(p => ({
        ...p,
        completed_modules: [...new Set([...p.completed_modules, moduleKey])]
      }));
    }
  }

  function downloadCSV() {
    let csv = 'Story ID,Title,Type,Mapped Obligation\n';
    for (const t of traceMatrix) {
      csv += `"${t.storyId}","${t.title}","${t.type}","${t.mappedObligation}"\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'traceability-matrix-' + Date.now() + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="topic">
  <div class="topic__nav">
    <button class="topic__back" on:click={() => navigate('/learn/governance')}>&larr; Governance Module</button>
    <Badge variant="level" text="Topic 3" />
    {#if isComplete}
      <Badge variant="success" text="Complete" />
    {/if}
  </div>

  <h1>Traceability Without Killing Agile</h1>
  <p class="topic__estimate">Estimated time: 35 minutes</p>

  <section class="topic__section">
    <h2>Why Regulators Require Traceability</h2>
    <p>Traceability is how a regulator or auditor confirms that every regulatory requirement has been addressed by the project. It answers the question: "Show me how requirement X was implemented, tested, and deployed." Without traceability, the regulator has only your word. With traceability, they have an evidence chain. In FCA investigations, the absence of traceability is routinely cited as a contributing factor to enforcement action — not because the control failed, but because the firm could not prove it existed.</p>
  </section>

  <section class="topic__section">
    <h2>The Traceability Matrix</h2>
    <p>A traceability matrix maps requirements (regulatory obligations, business needs) to implementation artefacts (epics, stories, test cases). In Agile, the matrix should be lightweight. It does not need to be a separate spreadsheet if your backlog tool supports tagging and filtering. The key is that every regulatory story has a visible link to its originating obligation, and every obligation has at least one story addressing it.</p>
  </section>

  <section class="topic__section">
    <h2>Lightweight Approaches</h2>
    <ul>
      <li><strong>Tagging:</strong> In Jira or Azure DevOps, tag stories with regulatory obligation IDs (e.g., "PCI-DSS-3.4", "FCA-CD-Timely"). This creates a filterable trace layer without extra documents.</li>
      <li><strong>Living Documentation:</strong> Use a README or Confluence page that links to Jira filters for each regulatory obligation. Update once per sprint.</li>
      <li><strong>Automated Reports:</strong> Some tools (e.g., Jira with Structure plugin, or custom scripts) can generate trace reports from structured fields.</li>
    </ul>
  </section>

  <section class="topic__section">
    <h2>What an Auditor Checks</h2>
    <p>In a traceability review, an auditor will look for three things: (1) <strong>orphaned stories</strong> — stories that exist with no link to any requirement; (2) <strong>untraceable regulatory items</strong> — regulatory obligations that appear nowhere in the backlog; (3) <strong>broken chains</strong> — a requirement mapped to a story that has no passing tests or no evidence of deployment. Fixing all three before an audit is far cheaper than explaining them during one.</p>
  </section>

  <section class="topic__section">
    <h2>Practical Exercise: Build a Traceability Matrix</h2>
    <p>Map each Meridian Bank fraud triage story to a regulatory obligation or business requirement:</p>

    <div class="exercise">
      <div class="exercise__obligations">
        <h3>Available Obligations</h3>
        <div class="exercise__tags">
          {#each regulatoryObligations as ob}
            <span class="exercise__tag">{ob.label}</span>
          {/each}
        </div>
      </div>

      <div class="exercise__table">
        <div class="exercise__table-header">
          <span class="exercise__col-id">Story</span>
          <span class="exercise__col-type">Type</span>
          <span class="exercise__col-ob">Mapped Obligation</span>
        </div>
        {#each traceMatrix as t (t.storyId)}
          <div class="exercise__table-row">
            <span class="exercise__col-id">{t.title}</span>
            <span class="exercise__col-type">
              <Badge variant={t.type === 'regulatory' ? 'regulatory' : 'info'} text={t.type} />
            </span>
            <span class="exercise__col-ob">
              <select value={t.mappedObligation} on:change={e => setObligation(t.storyId, e.target.value)}>
                <option value="">— Select —</option>
                {#each regulatoryObligations as ob}
                  <option value={ob.label}>{ob.label}</option>
                {/each}
              </select>
            </span>
          </div>
        {/each}
      </div>

      <div class="exercise__actions">
        <Button variant="primary" on:click={submitExercise}>Submit &amp; Score</Button>
        {#if submitted}
          <Button variant="secondary" on:click={downloadCSV}>Download CSV</Button>
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
            <p>All stories traced. No orphaned items. All obligations cited.</p>
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
  .exercise__obligations h3 { font-size: var(--text-sm); margin-bottom: var(--space-2); }
  .exercise__tags { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .exercise__tag { font-size: var(--text-xs); background: rgba(188, 140, 255, 0.1); color: var(--color-regulatory); border: 1px solid var(--color-regulatory); border-radius: var(--radius-sm); padding: 2px var(--space-2); font-family: var(--font-display); }
  .exercise__table { display: flex; flex-direction: column; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
  .exercise__table-header, .exercise__table-row { display: grid; grid-template-columns: 1fr 80px 1fr; gap: var(--space-2); padding: var(--space-3); align-items: center; font-size: var(--text-sm); }
  .exercise__table-header { background: var(--color-bg-surface); font-weight: 600; font-family: var(--font-display); font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.03em; color: var(--color-text-secondary); }
  .exercise__table-row { border-top: 1px solid var(--color-border); }
  .exercise__table-row select { background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: var(--space-1) var(--space-2); color: var(--color-text-primary); font-family: var(--font-body); font-size: var(--text-xs); width: 100%; }
  .exercise__actions { display: flex; gap: var(--space-3); }
  .exercise__result h3 { font-size: var(--text-lg); margin-bottom: var(--space-2); }
  .exercise__feedback { display: flex; flex-direction: column; gap: var(--space-1); padding-left: var(--space-4); }
  .exercise__feedback li { font-size: var(--text-sm); color: var(--color-accent-warning); }
  .exercise__ai-loading { font-size: var(--text-sm); color: var(--color-accent-secondary); padding: var(--space-2) 0; }
  .exercise__ai-text { font-size: var(--text-sm); line-height: 1.6; color: var(--color-text-secondary); white-space: pre-wrap; }
</style>
