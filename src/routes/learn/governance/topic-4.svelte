<script>
  import { navigate } from '../../../lib/router.js';
  import { progress } from '../../../lib/stores/progress.js';
  import Card from '../../../lib/components/Card.svelte';
  import Badge from '../../../lib/components/Badge.svelte';
  import Button from '../../../lib/components/Button.svelte';
  import FeatureGate from '../../../lib/components/FeatureGate.svelte';
  import { getDefaultClient } from '../../../lib/engines/byok-client.js';

  const moduleKey = 'governance-topic-4';
  $: isComplete = ($progress.completed_modules || []).includes(moduleKey);

  const allStories = [
    { id: 'pci-masking', title: 'PCI-DSS card data masking', type: 'regulatory', points: 8, correctCategory: 'emergency' },
    { id: 'audit-log', title: 'Audit logging system', type: 'regulatory', points: 5, correctCategory: 'emergency' },
    { id: 'doc-update', title: 'Update technical documentation', type: 'non-prod', points: 3, correctCategory: 'non-prod' },
    { id: 'test-automation', title: 'Write automated regression tests', type: 'non-prod', points: 5, correctCategory: 'non-prod' },
    { id: 'bpmn-mapping', title: 'BPMN process mapping for alert triage', type: 'non-prod', points: 3, correctCategory: 'non-prod' },
    { id: 'alert-ui', title: 'Alert queue UI enhancement', type: 'prod', points: 6, correctCategory: 'pause' },
    { id: 'alert-action', title: 'Alert actioning workflow improvement', type: 'prod', points: 5, correctCategory: 'pause' },
    { id: 'report-dash', title: 'Reporting dashboard', type: 'prod', points: 5, correctCategory: 'pause' }
  ];

  const categories = ['non-prod', 'emergency', 'pause'];

  let categorized = {
    'non-prod': [],
    'emergency': [],
    'pause': []
  };

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
      const submission = Object.entries(categorized).map(([cat, stories]) => ({ category: cat, stories: stories.map(s => s.title) }));
      const rubricResult = { score, passed: score >= 60 };
      const feedback = await byokClient.getGovernanceFeedback('topic-4', submission, rubricResult);
      if (feedback) aiFeedback = feedback;
    }
    aiFeedbackLoading = false;
  }

  function moveTo(storyId, category) {
    for (const cat of categories) {
      categorized[cat] = categorized[cat].filter(s => s.id !== storyId);
    }
    const story = allStories.find(s => s.id === storyId);
    if (story && category) {
      categorized[category] = [...categorized[category], story];
    }
  }

  function getCategoryLabel(cat) {
    if (cat === 'non-prod') return 'Continue (Non-Prod Work)';
    if (cat === 'emergency') return 'Emergency Change Exception';
    return 'Pause Until Freeze Ends';
  }

  function getCategoryDesc(cat) {
    if (cat === 'non-prod') return 'Documentation, tests, BPMN mapping — no deployment needed';
    if (cat === 'emergency') return 'Regulatory must-haves qualifying for emergency CAB process';
    return 'Production changes that must wait for the freeze to lift';
  }

  function submitExercise() {
    feedbackItems = [];
    let s = 0;
    let correctCount = 0;

    for (const story of allStories) {
      let assigned = null;
      for (const cat of categories) {
        if (categorized[cat].find(s => s.id === story.id)) {
          assigned = cat;
          break;
        }
      }
      if (assigned === story.correctCategory) {
        correctCount++;
      } else {
        feedbackItems.push(`"${story.title}" should be in "${getCategoryLabel(story.correctCategory)}"`);
      }
    }

    s = Math.round((correctCount / allStories.length) * 100);
    score = s;
    submitted = true;

    if (s >= 60) {
      progress.update(p => ({
        ...p,
        completed_modules: [...new Set([...p.completed_modules, moduleKey])]
      }));
    }
  }

  function downloadPlan() {
    const content = `Sprint Replanning — Change Freeze Response
===========================================
Generated: ${new Date().toISOString()}

Context: 2-week change freeze announced on day 3 of sprint.

--- Non-Production Work (Continue) ---
${categorized['non-prod'].map(s => `  [${s.points}pt] ${s.title} (${s.type})`).join('\n') || '  (none)'}

--- Emergency Change Exception (Regulatory) ---
${categorized['emergency'].map(s => `  [${s.points}pt] ${s.title} (${s.type})`).join('\n') || '  (none)'}

--- Paused Until Freeze Ends ---
${categorized['pause'].map(s => `  [${s.points}pt] ${s.title} (${s.type})`).join('\n') || '  (none)'}

Justification for Emergency Exceptions:
${categorized['emergacy'].map(s => `  ${s.title}: PCI-DSS regulatory requirement — cannot wait for freeze window`).join('\n') || '  N/A'}

Rollback Plan:
  [Standard rollback procedure per deployment pipeline]
  [Database migrations reversible]
  [Feature flags for all changes]
  [Monitoring dashboard alert thresholds configured]

Score: ${score}/100
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sprint-replan-freeze-' + Date.now() + '.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  function isAssigned(storyId) {
    for (const cat of categories) {
      if (categorized[cat].find(s => s.id === storyId)) return true;
    }
    return false;
  }
</script>

<div class="topic">
  <div class="topic__nav">
    <button class="topic__back" on:click={() => navigate('/learn/governance')}>&larr; Governance Module</button>
    <Badge variant="level" text="Topic 4" />
    {#if isComplete}
      <Badge variant="success" text="Complete" />
    {/if}
  </div>

  <h1>Agile Release Management in Regulated Environments</h1>
  <p class="topic__estimate">Estimated time: 30 minutes</p>

  <section class="topic__section">
    <h2>Release vs Deployment</h2>
    <p>In regulated environments, <strong>deployment</strong> (moving code to production) and <strong>release</strong> (making functionality available to customers) are distinct. A deployment might happen behind a feature flag; the release is the moment you toggle the flag and the functionality becomes customer-facing. The CAB approves the release, not the deployment. Feature flags are a critical tool — they allow you to deploy incrementally and release only after CAB approval, without coupling the two timelines.</p>
  </section>

  <section class="topic__section">
    <h2>Change Freeze Strategies</h2>
    <p>When a change freeze hits mid-sprint, you have three strategies:</p>
    <ul>
      <li><strong>Non-production work:</strong> Continue documentation, testing, BPMN mapping, and other work that does not touch production. This keeps the team productive.</li>
      <li><strong>Emergency change exception:</strong> Regulatory stories may qualify if they address a compliance deadline or regulatory finding. Requires senior management sponsorship.</li>
      <li><strong>Full pause:</strong> Accept the freeze and treat the remaining sprint days as a hardening period. Plan to carry stories into the next sprint.</li>
    </ul>
  </section>

  <section class="topic__section">
    <h2>Rollback Planning</h2>
    <p>A rollback plan is not optional in regulated environments. Every change must answer: "How do we revert?" The plan should include database migration reversal steps, feature flag toggles, and monitoring thresholds that would trigger the rollback. Make rollback planning a sprint artefact — include it in your DoD for any production-facing story.</p>
  </section>

  <section class="topic__section">
    <h2>The Release Train</h2>
    <p>In scaled Agile (SAFe), the release train concept coordinates multiple teams on a fixed cadence. In regulated contexts, the release train interacts with the CAB schedule: the CAB becomes a release train checkpoint. Plan your PI (Programme Increment) so that each train's release aligns with a CAB meeting date.</p>
  </section>

  <section class="topic__section">
    <h2>Practical Exercise: Replan a Sprint Under Change Freeze</h2>
    <p>A 2-week change freeze has been announced on day 3 of your sprint. Categorise each story into the correct track:</p>

    <div class="exercise">
      <div class="exercise__stories">
        {#each allStories as story (story.id)}
          <div class="exercise__story" class:exercise__story--assigned={isAssigned(story.id)}>
            <div class="exercise__story-meta">
              <Badge variant={story.type === 'regulatory' ? 'regulatory' : story.type === 'non-prod' ? 'info' : 'warning'} text={story.type} />
              <span class="exercise__points">{story.points}pt</span>
            </div>
            <span class="exercise__story-title">{story.title}</span>
            <div class="exercise__story-actions">
              {#each categories as cat}
                <button class="exercise__cat-btn" class:exercise__cat-btn--active={categorized[cat].find(s => s.id === story.id)} on:click={() => moveTo(story.id, cat)}>
                  {getCategoryLabel(cat).split(' ')[0]}
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      <div class="exercise__categories">
        {#each categories as cat}
          <div class="exercise__category-card">
            <h3>{getCategoryLabel(cat)}</h3>
            <p class="exercise__cat-desc">{getCategoryDesc(cat)}</p>
            <div class="exercise__cat-stories">
              {#if categorized[cat].length === 0}
                <p class="exercise__empty">Drop stories here</p>
              {:else}
                {#each categorized[cat] as story (story.id)}
                  <div class="exercise__cat-story">
                    <span>{story.title}</span>
                    <span class="exercise__cat-pts">{story.points}pt</span>
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <div class="exercise__actions">
        <Button variant="primary" on:click={submitExercise}>Submit &amp; Score</Button>
        {#if submitted}
          <Button variant="secondary" on:click={downloadPlan}>Download Replanning Document</Button>
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
            <p>All stories correctly classified. Rollback plan noted.</p>
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
  .exercise__stories { display: flex; flex-direction: column; gap: var(--space-2); }
  .exercise__story { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--text-sm); }
  .exercise__story--assigned { border-color: var(--color-accent-secondary); }
  .exercise__story-meta { display: flex; align-items: center; gap: var(--space-1); flex-shrink: 0; }
  .exercise__points { font-size: var(--text-xs); color: var(--color-text-secondary); font-family: var(--font-display); }
  .exercise__story-title { flex: 1; }
  .exercise__story-actions { display: flex; gap: var(--space-1); }
  .exercise__cat-btn { font-size: 10px; padding: 2px var(--space-1); border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: transparent; color: var(--color-text-secondary); cursor: pointer; font-family: var(--font-display); }
  .exercise__cat-btn--active { background: var(--color-accent-primary); color: var(--color-bg-primary); border-color: var(--color-accent-primary); }
  .exercise__categories { display: flex; flex-direction: column; gap: var(--space-3); }
  .exercise__category-card { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  .exercise__category-card h3 { font-size: var(--text-base); margin-bottom: var(--space-1); }
  .exercise__cat-desc { font-size: var(--text-xs); color: var(--color-text-secondary); margin-bottom: var(--space-3); }
  .exercise__cat-stories { display: flex; flex-direction: column; gap: var(--space-2); min-height: 40px; }
  .exercise__empty { font-size: var(--text-xs); color: var(--color-text-secondary); text-align: center; padding: var(--space-2); font-style: italic; }
  .exercise__cat-story { display: flex; justify-content: space-between; font-size: var(--text-sm); padding: var(--space-2); background: var(--color-bg-primary); border-radius: var(--radius-sm); }
  .exercise__cat-pts { font-size: var(--text-xs); color: var(--color-text-secondary); font-family: var(--font-display); }
  .exercise__actions { display: flex; gap: var(--space-3); }
  .exercise__result h3 { font-size: var(--text-lg); margin-bottom: var(--space-2); }
  .exercise__feedback { display: flex; flex-direction: column; gap: var(--space-1); padding-left: var(--space-4); }
  .exercise__feedback li { font-size: var(--text-sm); color: var(--color-accent-warning); }
  .exercise__ai-loading { font-size: var(--text-sm); color: var(--color-accent-secondary); padding: var(--space-2) 0; }
  .exercise__ai-text { font-size: var(--text-sm); line-height: 1.6; color: var(--color-text-secondary); white-space: pre-wrap; }
</style>
