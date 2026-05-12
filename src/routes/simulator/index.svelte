<script>
  import { navigate } from '../../lib/router.js';
  import { sim } from '../../lib/stores/state.js';
  import { getAllScenarios } from '../../lib/engines/scenario-engine.js';
  import Button from '../../lib/components/Button.svelte';
  import ProjectDashboard from '../../lib/components/ProjectDashboard.svelte';
  import PersonaPanel from '../../lib/components/PersonaPanel.svelte';

  $: p = $sim;
  $: scenarios = getAllScenarios();

  function startScenario(id) {
    sim.loadScenario(id);
    navigate(`/simulator/${id}`);
  }

  function resumeScenario() {
    if (p.scenario_id) {
      navigate(`/simulator/${p.scenario_id}`);
    }
  }
</script>

<div class="sim-hub">
  <div class="sim-hub__header">
    <h1 class="sim-hub__title">Simulator</h1>
    <p class="sim-hub__subtitle">Run a workday simulation in a regulated project environment.</p>
  </div>

  {#if p.scenario_id && p.phase !== 'intro'}
    <div class="sim-hub__active">
      <h2>Active Session</h2>
      <div class="sim-hub__active-grid">
        <div class="sim-hub__active-info">
          <p><strong>Scenario:</strong> {p.scenario_id}</p>
          <p><strong>Day:</strong> {p.timeline?.day || 1}</p>
          <p><strong>Status:</strong> {p.phase}</p>
        </div>
        <Button variant="primary" on:click={resumeScenario}>Resume Session</Button>
        <Button variant="ghost" on:click={() => { sim.reset(); }}>End Session</Button>
      </div>
    </div>
  {/if}

  <div class="sim-hub__scenarios">
    <h2>Start New Scenario</h2>
    <div class="scenario-list">
      {#each scenarios as s}
        <div class="scenario-card" on:click={() => startScenario(s.id)} on:keydown={(e) => e.key === 'Enter' && startScenario(s.id)} tabindex="0" role="button">
          <div class="scenario-card__header">
            <span class="scenario-card__difficulty scenario-card__difficulty--{s.difficulty}">{s.difficulty}</span>
            <span class="scenario-card__days">{s.estimatedDays} day{(s.estimatedDays || 0) > 1 ? 's' : ''}</span>
          </div>
          <h3 class="scenario-card__title">{s.title}</h3>
          <p class="scenario-card__desc">{s.description}</p>
          <div class="scenario-card__role">
            <span class="scenario-card__role-label">Role: {s.role === 'pm' ? 'Project Manager' : 'Business Analyst'}</span>
          </div>
        </div>
      {/each}
    </div>
  </div>

  {#if p.scenario_id && p.phase !== 'intro'}
    <div class="sim-hub__dashboard">
      <h2>Project Snapshot</h2>
      <div class="sim-hub__dashboard-grid">
        <ProjectDashboard />
        <PersonaPanel />
      </div>
    </div>
  {/if}
</div>

<style>
  .sim-hub { padding: var(--space-8) var(--space-6); max-width: 900px; margin: 0 auto; }
  .sim-hub__header { margin-bottom: var(--space-8); }
  .sim-hub__title { font-family: var(--font-display); font-size: var(--text-3xl); font-weight: 700; }
  .sim-hub__subtitle { color: var(--color-text-secondary); margin-top: var(--space-2); }
  .sim-hub__active { padding: var(--space-5); border: 1px solid var(--color-accent); border-radius: var(--radius-lg); background: rgba(240, 136, 62, 0.06); margin-bottom: var(--space-8); }
  .sim-hub__active h2 { font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-3); }
  .sim-hub__active-grid { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
  .sim-hub__active-info { flex: 1; font-size: var(--text-sm); color: var(--color-text-secondary); }
  .sim-hub__active-info p { margin-bottom: var(--space-1); }
  .sim-hub__scenarios { margin-bottom: var(--space-8); }
  .sim-hub__scenarios h2 { font-size: var(--text-xl); font-weight: 600; margin-bottom: var(--space-4); }
  .scenario-list { display: flex; flex-direction: column; gap: var(--space-3); }
  .scenario-card { padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg-surface); cursor: pointer; transition: border-color var(--transition-fast); }
  .scenario-card:hover { border-color: var(--color-accent); }
  .scenario-card__header { display: flex; gap: var(--space-3); margin-bottom: var(--space-2); }
  .scenario-card__difficulty { font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.05em; padding: 2px var(--space-2); border-radius: var(--radius-sm); }
  .scenario-card__difficulty--intermediate { background: rgba(210, 153, 34, 0.15); color: var(--color-yellow); }
  .scenario-card__days { font-size: var(--text-xs); color: var(--color-text-muted); }
  .scenario-card__title { font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-1); }
  .scenario-card__desc { font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.5; margin-bottom: var(--space-2); }
  .scenario-card__role { font-size: var(--text-xs); color: var(--color-text-muted); }
  .sim-hub__dashboard { }
  .sim-hub__dashboard h2 { font-size: var(--text-xl); font-weight: 600; margin-bottom: var(--space-4); }
  .sim-hub__dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
</style>
