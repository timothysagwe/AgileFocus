<script>
  import { onMount } from 'svelte';
  import { navigate } from '../../lib/router.js';
  import { project, phaseList } from '../../lib/stores/project.js';
  import { progress } from '../../lib/stores/progress.js';
  import Button from '../../lib/components/Button.svelte';
  import Badge from '../../lib/components/Badge.svelte';
  import Card from '../../lib/components/Card.svelte';

  let lessonsLearned = '';
  let portfolioGenerated = false;
  let finalScore = null;

  $: p = $project;
  $: phases = $phaseList;
  $: completed = p.completed_phases?.includes('retrospective');
  $: allPhasesComplete = p.completed_phases?.length >= 6;

  onMount(() => {
    const engine = project.getEngine();
    finalScore = engine.calculateFinalScore();
    if (!p.is_complete) {
      project.completePhase('retrospective', {
        completion_rate: allPhasesComplete ? 100 : Math.round((p.completed_phases?.length || 0) / 7 * 100),
        improvement_identification: lessonsLearned.length > 20 ? 80 : 30,
        overall_score: finalScore.finalPercentage,
        percentage: finalScore.finalPercentage
      });
    }
  });

  $: if (finalScore) {
    finalScore = project.getEngine().calculateFinalScore();
  }

  function downloadPortfolio() {
    const engine = project.getEngine();
    const score = engine.calculateFinalScore();
    const portfolio = {
      project: { started: p.started, completed: p.completed },
      role: p.role,
      finalScore: score,
      artefacts: p.artefacts,
      decisionLog: p.decision_log,
      completedPhases: p.completed_phases,
      projectHealth: p.project_health,
      stakeholderTrust: p.stakeholder_trust,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(portfolio, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agilefocus-portfolio-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    portfolioGenerated = true;
  }

  function resetProject() {
    project.reset();
    navigate('/project');
  }
</script>

<div class="phase">
  <div class="phase__header">
    <button class="phase__back" on:click={() => navigate('/project')}>← Dashboard</button>
    <Badge variant="info" text="Phase 7 of 7" />
  </div>

  <h1 class="phase__title">Project Retrospective</h1>
  <p class="phase__subtitle">Review your project, generate your portfolio, and receive your final grade.</p>

  <div class="phase__content">
    {#if finalScore}
      <div class="phase__grade phase__grade--{finalScore.grade}">
        <div class="phase__grade-header">
          <span class="phase__grade-label">Final Grade</span>
          <span class="phase__grade-value">{finalScore.grade.toUpperCase()}</span>
        </div>
        <p class="phase__grade-narrative">{finalScore.narrative}</p>
        <div class="phase__grade-score">{finalScore.finalPercentage}%</div>
      </div>

      <div class="phase__breakdown">
        <h2>Score Breakdown</h2>
        <div class="phase__breakdown-list">
          {#each finalScore.breakdown as item}
            <div class="phase__breakdown-item">
              <span class="phase__breakdown-phase">{item.label}</span>
              <div class="phase__breakdown-bar">
                <div class="phase__breakdown-fill" style="width: {item.score}%"></div>
              </div>
              <span class="phase__breakdown-score">{item.score}%</span>
              <span class="phase__breakdown-weight">x{item.weight}</span>
            </div>
          {/each}
        </div>
      </div>

      <div class="phase__health-summary">
        <h2>Project Health</h2>
        <div class="phase__health-grid">
          {#each Object.entries(finalScore.projectHealth) as [key, val]}
            <div class="phase__health-item">
              <span class="phase__health-label">{key.replace(/_/g, ' ')}</span>
              <span class="phase__health-value" class:phase__health-value--good={val >= 70} class:phase__health-value--warn={val >= 40 && val < 70} class:phase__health-value--bad={val < 40}>{Math.round(val)}%</span>
            </div>
          {/each}
        </div>
      </div>

      <div class="phase__stakeholder-summary">
        <h2>Stakeholder Trust</h2>
        <div class="phase__health-grid">
          {#each Object.entries(finalScore.stakeholderTrust) as [key, val]}
            <div class="phase__health-item">
              <span class="phase__health-label">{key.replace(/_/g, ' ')}</span>
              <span class="phase__health-value" class:phase__health-value--good={val >= 70} class:phase__health-value--warn={val >= 40 && val < 70} class:phase__health-value--bad={val < 40}>{Math.round(val)}%</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="phase__card">
      <h2>Lessons Learned</h2>
      <p class="phase__card-hint">Reflect on what you would do differently.</p>
      <textarea
        class="phase__textarea"
        bind:value={lessonsLearned}
        placeholder="What went well?&#10;What would you change?&#10;What regulatory challenges did you face?"
        rows="5"
      ></textarea>
    </div>

    <div class="phase__card">
      <h2>Project Artefacts</h2>
      <p class="phase__card-hint">Your project generated {finalScore?.totalArtefacts || 0} artefacts across {p.completed_phases?.length || 0} phases.</p>
      <div class="phase__artefact-list">
        {#each Object.entries(p.artefacts || {}) as [phaseId, artefacts]}
          <div class="phase__artefact-item">
            <span class="phase__artefact-phase">{phaseId.replace(/-/g, ' ')}</span>
            <Badge variant="info" text="Artefacts saved" />
          </div>
        {/each}
      </div>
    </div>

    <div class="phase__actions">
      <Button variant="secondary" on:click={downloadPortfolio}>
        {portfolioGenerated ? 'Download Again' : 'Download Portfolio'}
      </Button>
      <Button variant="ghost" on:click={resetProject}>Start New Project</Button>
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
  .phase__content { display: flex; flex-direction: column; gap: var(--space-6); }

  .phase__grade { padding: var(--space-6); border-radius: var(--radius-lg); text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--space-3); }
  .phase__grade--distinction { background: linear-gradient(135deg, rgba(240, 136, 62, 0.15), rgba(88, 166, 255, 0.1)); border: 2px solid var(--color-accent-primary); }
  .phase__grade--merit { background: rgba(88, 166, 255, 0.1); border: 2px solid var(--color-accent-secondary); }
  .phase__grade--pass { background: rgba(63, 185, 80, 0.1); border: 2px solid var(--color-accent-success); }
  .phase__grade--near_miss { background: rgba(210, 153, 34, 0.1); border: 2px solid var(--color-accent-warning); }
  .phase__grade--fail { background: rgba(248, 81, 73, 0.1); border: 2px solid var(--color-accent-danger); }
  .phase__grade-header { display: flex; align-items: center; gap: var(--space-4); }
  .phase__grade-label { font-size: var(--text-sm); color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
  .phase__grade-value { font-family: var(--font-display); font-size: var(--text-3xl); font-weight: 700; }
  .phase__grade-narrative { font-size: var(--text-sm); color: var(--color-text-secondary); max-width: 500px; line-height: 1.6; }
  .phase__grade-score { font-family: var(--font-display); font-size: var(--text-4xl); font-weight: 700; }

  .phase__breakdown h2, .phase__health-summary h2, .phase__stakeholder-summary h2 { font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-3); }
  .phase__breakdown-list { display: flex; flex-direction: column; gap: var(--space-2); }
  .phase__breakdown-item { display: flex; align-items: center; gap: var(--space-3); font-size: var(--text-sm); }
  .phase__breakdown-phase { min-width: 120px; text-transform: capitalize; }
  .phase__breakdown-bar { flex: 1; height: 6px; background: var(--color-border); border-radius: 3px; overflow: hidden; }
  .phase__breakdown-fill { height: 100%; background: var(--color-accent-primary); border-radius: 3px; }
  .phase__breakdown-score { font-family: var(--font-display); min-width: 40px; text-align: right; }
  .phase__breakdown-weight { color: var(--color-text-secondary); font-size: var(--text-xs); min-width: 30px; }

  .phase__health-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--space-2); }
  .phase__health-item { padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: var(--space-1); }
  .phase__health-label { font-size: var(--text-xs); color: var(--color-text-secondary); text-transform: capitalize; }
  .phase__health-value { font-family: var(--font-display); font-weight: 700; }
  .phase__health-value--good { color: var(--color-accent-success); }
  .phase__health-value--warn { color: var(--color-accent-warning); }
  .phase__health-value--bad { color: var(--color-accent-danger); }

  .phase__card { padding: var(--space-6); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-bg-surface); }
  .phase__card h2 { font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-2); }
  .phase__card-hint { font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-4); }
  .phase__textarea { width: 100%; background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-3); color: var(--color-text-primary); font-family: var(--font-body); font-size: var(--text-sm); resize: vertical; }

  .phase__artefact-list { display: flex; flex-direction: column; gap: var(--space-2); }
  .phase__artefact-item { display: flex; align-items: center; justify-content: space-between; padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: var(--text-sm); }
  .phase__artefact-phase { text-transform: capitalize; }
  .phase__actions { display: flex; justify-content: space-between; padding-top: var(--space-4); }
</style>
