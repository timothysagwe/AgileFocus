<script>
  import { navigate } from '../../../lib/router.js';
  import { progress } from '../../../lib/stores/progress.js';
  import Card from '../../../lib/components/Card.svelte';
  import Badge from '../../../lib/components/Badge.svelte';
  import Button from '../../../lib/components/Button.svelte';
  import FeatureGate from '../../../lib/components/FeatureGate.svelte';
  import { getDefaultClient } from '../../../lib/engines/byok-client.js';

  const moduleKey = 'governance-topic-6';
  $: isComplete = ($progress.completed_modules || []).includes(moduleKey);

  const doraPillars = [
    { id: 'ict-risk', label: 'ICT Risk Management' },
    { id: 'incident-reporting', label: 'Incident Reporting' },
    { id: 'resilience-testing', label: 'Resilience Testing' },
    { id: 'third-party-risk', label: 'Third Party Risk' },
    { id: 'info-sharing', label: 'Information Sharing' },
    { id: 'not-applicable', label: 'Not DORA-Relevant' }
  ];

  const stories = [
    { id: 'alert-queue', title: 'Fraud alert queue', type: 'regulatory', correctPillar: 'ict-risk', obligationType: 'mandatory', priority: 'high' },
    { id: 'action-alert', title: 'Alert actioning workflow', type: 'business', correctPillar: 'ict-risk', obligationType: 'advisory', priority: 'medium' },
    { id: 'alert-logging', title: 'Alert timestamp logging', type: 'regulatory', correctPillar: 'incident-reporting', obligationType: 'mandatory', priority: 'high' },
    { id: 'alert-thresholds', title: 'Alert threshold configuration', type: 'business', correctPillar: 'ict-risk', obligationType: 'advisory', priority: 'medium' },
    { id: 'case-notes', title: 'Case notes', type: 'business', correctPillar: 'not-applicable', obligationType: 'advisory', priority: 'low' },
    { id: 'pci-masking', title: 'PCI-DSS card data masking', type: 'regulatory', correctPillar: 'ict-risk', obligationType: 'mandatory', priority: 'high' },
    { id: 'escalate-alert', title: 'Alert escalation to senior review', type: 'regulatory', correctPillar: 'incident-reporting', obligationType: 'mandatory', priority: 'high' },
    { id: 'audit-log', title: 'User actions audit logged', type: 'regulatory', correctPillar: 'ict-risk', obligationType: 'mandatory', priority: 'high' },
    { id: 'vendor-integration', title: 'Third-party vendor alert feed integration', type: 'business', correctPillar: 'third-party-risk', obligationType: 'mandatory', priority: 'high' },
    { id: 'resilience-test', title: 'System resilience testing', type: 'business', correctPillar: 'resilience-testing', obligationType: 'mandatory', priority: 'high' }
  ];

  let tags = stories.map(s => ({
    storyId: s.id,
    title: s.title,
    type: s.type,
    pillar: '',
    obligationType: '',
    priority: ''
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
      const rubricResult = { score, passed: score >= 60 };
      const feedback = await byokClient.getGovernanceFeedback('topic-6', tags, rubricResult);
      if (feedback) aiFeedback = feedback;
    }
    aiFeedbackLoading = false;
  }

  function updateTag(storyId, field, value) {
    tags = tags.map(t => t.storyId === storyId ? { ...t, [field]: value } : t);
  }

  function getPillarTag(pillarId) {
    const p = doraPillars.find(dp => dp.id === pillarId);
    return p ? p.label : '';
  }

  function submitExercise() {
    feedbackItems = [];
    let correctPillar = 0;
    let correctObligation = 0;
    let correctPriority = 0;

    for (const story of stories) {
      const tag = tags.find(t => t.storyId === story.id);
      if (!tag) continue;

      if (tag.pillar === story.correctPillar) correctPillar++;
      else feedbackItems.push(`"${story.title}" — pillar should be "${getPillarTag(story.correctPillar)}"`);

      if (tag.obligationType === story.obligationType) correctObligation++;
      else feedbackItems.push(`"${story.title}" — obligation type should be "${story.obligationType}"`);

      if (tag.priority === story.priority) correctPriority++;
    }

    const totalChecks = stories.length * 3;
    const totalCorrect = correctPillar + correctObligation + correctPriority;
    score = Math.round((totalCorrect / totalChecks) * 100);
    submitted = true;

    if (score >= 60) {
      progress.update(p => ({
        ...p,
        completed_modules: [...new Set([...p.completed_modules, moduleKey])]
      }));
    }
  }

  function downloadDORAExport() {
    let content = 'DORA-Tagged Backlog Export\n';
    content += '===============================\n';
    content += `Generated: ${new Date().toISOString()}\n\n`;
    content += 'Story ID,Title,Type,DORA Pillar,Obligation Type,Priority\n';
    for (const t of tags) {
      content += `"${t.storyId}","${t.title}","${t.type}","${t.pillar || 'unassigned'}","${t.obligationType || 'unassigned'}","${t.priority || 'unassigned'}"\n`;
    }
    content += `\nScore: ${score}/100\n`;

    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dora-backlog-tags-' + Date.now() + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="topic">
  <div class="topic__nav">
    <button class="topic__back" on:click={() => navigate('/learn/governance')}>&larr; Governance Module</button>
    <Badge variant="level" text="Topic 6" />
    {#if isComplete}
      <Badge variant="success" text="Complete" />
    {/if}
  </div>

  <h1>DORA and Operational Resilience in Project Context</h1>
  <p class="topic__estimate">Estimated time: 35 minutes</p>

  <section class="topic__section">
    <h2>What is DORA?</h2>
    <p>The Digital Operational Resilience Act (DORA) is an EU regulation that establishes uniform requirements for the security of network and information systems of financial entities. It entered into force in January 2023, with application from January 2025. While DORA is EU legislation, its UK equivalents — the FCA's operational resilience policy (PS21/3) and the PRA's operational resilience requirements — impose substantially similar obligations. For UK financial services, the concepts are directly applicable and are increasingly referenced by FCA supervisors during engagement.</p>
  </section>

  <section class="topic__section">
    <h2>The Five DORA Pillars</h2>
    <ul>
      <li><strong>ICT Risk Management:</strong> Financial entities must have a comprehensive ICT risk management framework. For Agile teams, this means ICT risk must be considered during backlog refinement and sprint planning — it is not something "the security team handles."</li>
      <li><strong>Incident Reporting:</strong> Major ICT incidents must be reported to regulators within timelines (24 hours for the initial notification under DORA). Your systems must be capable of producing incident data at this speed.</li>
      <li><strong>Resilience Testing:</strong> Regular testing of ICT systems, including threat-led penetration testing. Agile teams should build resilience tests into their DoD and include test results in the evidence pack.</li>
      <li><strong>Third Party Risk:</strong> Contracts with ICT third-party providers must include specific DORA clauses. When your sprint has a dependency on an external vendor, that vendor's DORA compliance becomes your risk.</li>
      <li><strong>Information Sharing:</strong> Entities can share cyber threat information under DORA's safe harbour provisions. For projects, this means building systems that can produce and consume threat intelligence in standardised formats.</li>
    </ul>
  </section>

  <section class="topic__section">
    <h2>DORA in Backlog Refinement</h2>
    <p>Every user story should be assessed for DORA relevance during backlog refinement. The BA should ask: "Does this story touch a system that processes customer data, handles incidents, or depends on a third party?" If yes, it has DORA implications. These items are non-negotiable from a regulatory perspective — treat them like PCI-DSS stories, not like nice-to-have features. Tag them in your backlog tool with the relevant DORA pillar so traceability is built in from day one.</p>
  </section>

  <section class="topic__section">
    <h2>Practical Exercise: Tag a Backlog for DORA</h2>
    <p>Tag each Meridian Bank fraud triage story with its DORA pillar, obligation type, and implementation priority:</p>

    <div class="exercise">
      <div class="exercise__pillars">
        <h3>DORA Pillars</h3>
        <div class="exercise__tags">
          {#each doraPillars as p}
            <span class="exercise__tag">{p.label}</span>
          {/each}
        </div>
      </div>

      <div class="exercise__table">
        <div class="exercise__table-header">
          <span class="exercise__col-story">Story</span>
          <span class="exercise__col-pillar">DORA Pillar</span>
          <span class="exercise__col-ob">Obligation</span>
          <span class="exercise__col-pri">Priority</span>
        </div>
        {#each tags as t (t.storyId)}
          <div class="exercise__table-row">
            <span class="exercise__col-story">
              {t.title}
              <span class="exercise__type-badge">
                <Badge variant={t.type === 'regulatory' ? 'regulatory' : 'info'} text={t.type} />
              </span>
            </span>
            <span class="exercise__col-pillar">
              <select value={t.pillar} on:change={e => updateTag(t.storyId, 'pillar', e.target.value)}>
                <option value="">— Select —</option>
                {#each doraPillars as p}
                  <option value={p.id}>{p.label}</option>
                {/each}
              </select>
            </span>
            <span class="exercise__col-ob">
              <select value={t.obligationType} on:change={e => updateTag(t.storyId, 'obligationType', e.target.value)}>
                <option value="">—</option>
                <option value="mandatory">Mandatory</option>
                <option value="advisory">Advisory</option>
              </select>
            </span>
            <span class="exercise__col-pri">
              <select value={t.priority} on:change={e => updateTag(t.storyId, 'priority', e.target.value)}>
                <option value="">—</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </span>
          </div>
        {/each}
      </div>

      <div class="exercise__actions">
        <Button variant="primary" on:click={submitExercise}>Submit &amp; Score</Button>
        {#if submitted}
          <Button variant="secondary" on:click={downloadDORAExport}>Download DORA Export</Button>
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
            <p>All pillars correctly assigned. All mandatory items identified.</p>
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
  .exercise__pillars h3 { font-size: var(--text-sm); margin-bottom: var(--space-2); }
  .exercise__tags { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .exercise__tag { font-size: var(--text-xs); background: rgba(188, 140, 255, 0.1); color: var(--color-regulatory); border: 1px solid var(--color-regulatory); border-radius: var(--radius-sm); padding: 2px var(--space-2); font-family: var(--font-display); }
  .exercise__table { display: flex; flex-direction: column; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
  .exercise__table-header, .exercise__table-row { display: grid; grid-template-columns: 2fr 1fr 100px 80px; gap: var(--space-2); padding: var(--space-2) var(--space-3); align-items: center; font-size: var(--text-sm); }
  .exercise__table-header { background: var(--color-bg-surface); font-weight: 600; font-family: var(--font-display); font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.03em; color: var(--color-text-secondary); }
  .exercise__table-row { border-top: 1px solid var(--color-border); }
  .exercise__table-row select { background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: var(--space-1) var(--space-2); color: var(--color-text-primary); font-family: var(--font-body); font-size: var(--text-xs); width: 100%; }
  .exercise__col-story { display: flex; align-items: center; gap: var(--space-2); }
  .exercise__type-badge { flex-shrink: 0; }
  .exercise__actions { display: flex; gap: var(--space-3); }
  .exercise__result h3 { font-size: var(--text-lg); margin-bottom: var(--space-2); }
  .exercise__feedback { display: flex; flex-direction: column; gap: var(--space-1); padding-left: var(--space-4); }
  .exercise__feedback li { font-size: var(--text-sm); color: var(--color-accent-warning); }
  .exercise__ai-loading { font-size: var(--text-sm); color: var(--color-accent-secondary); padding: var(--space-2) 0; }
  .exercise__ai-text { font-size: var(--text-sm); line-height: 1.6; color: var(--color-text-secondary); white-space: pre-wrap; }
</style>
