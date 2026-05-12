<script>
  import { onDestroy } from 'svelte';
  import { navigate } from '../../lib/router.js';
  import { sim } from '../../lib/stores/state.js';
  import { getScenario } from '../../lib/engines/scenario-engine.js';
  import Inbox from '../../lib/components/Inbox.svelte';
  import DecisionPanel from '../../lib/components/DecisionPanel.svelte';
  import BlockerPanel from '../../lib/components/BlockerPanel.svelte';
  import PersonaPanel from '../../lib/components/PersonaPanel.svelte';
  import ProjectDashboard from '../../lib/components/ProjectDashboard.svelte';
  import TimelineBar from '../../lib/components/TimelineBar.svelte';
  import EventLog from '../../lib/components/EventLog.svelte';
  import Button from '../../lib/components/Button.svelte';

  export let scenarioId = '';

  $: p = $sim;
  $: scenario = getScenario(scenarioId);
  $: loaded = p.scenario_id === scenarioId && p.phase !== 'intro';
  $: ended = p.phase === 'complete' || p.phase === 'failed';

  function start() {
    sim.loadScenario(scenarioId);
    setTimeout(() => sim.startWorkday(), 100);
  }

  function goBack() {
    sim.pause();
    navigate('/simulator');
  }

  $: if (ended) {
    const t = setTimeout(() => {}, 0);
  }

  onDestroy(() => {
    sim.pause();
  });
</script>

<div class="sim-view">
  <div class="sim-view__top">
    <div class="sim-view__top-left">
      <button class="sim-view__back" on:click={goBack}>← Simulator Hub</button>
    </div>
    <div class="sim-view__top-center">
      <TimelineBar />
    </div>
    <div class="sim-view__top-right">
      {#if p.phase === 'failed'}
        <span class="sim-view__status sim-view__status--fail">Failed</span>
      {:else if p.phase === 'complete'}
        <span class="sim-view__status sim-view__status--complete">Complete</span>
      {:else if p.phase === 'running'}
        <span class="sim-view__status sim-view__status--live">Live</span>
      {:else if p.phase === 'paused'}
        <span class="sim-view__status sim-view__status--paused">Paused</span>
      {:else}
        <span class="sim-view__status">Ready</span>
      {/if}
    </div>
  </div>

  {#if !loaded && !ended}
    <div class="sim-view__start">
      <h2>{scenario?.title || 'Scenario'}</h2>
      <p>{scenario?.description || ''}</p>
      <div class="sim-view__start-actions">
        <Button variant="primary" size="lg" on:click={start}>Start Workday</Button>
        <Button variant="ghost" on:click={goBack}>Back</Button>
      </div>
    </div>
  {:else if ended}
    <div class="sim-view__end">
      <h2>Session Complete</h2>
      <div class="sim-view__end-stats">
        <div class="sim-view__end-stat">
          <span class="sim-view__end-label">Days Simulated</span>
          <span class="sim-view__end-value">{p.timeline?.day || 1}</span>
        </div>
        <div class="sim-view__end-stat">
          <span class="sim-view__end-label">Delivery Health</span>
          <span class="sim-view__end-value">{Math.round(p.delivery_health || 0)}%</span>
        </div>
        <div class="sim-view__end-stat">
          <span class="sim-view__end-label">Audit Risk</span>
          <span class="sim-view__end-value">{Math.round(p.audit_risk || 0)}%</span>
        </div>
        <div class="sim-view__end-stat">
          <span class="sim-view__end-label">Messages Handled</span>
          <span class="sim-view__end-value">{p.inbox?.filter(m => m.status === 'responded').length || 0}/{p.inbox?.length || 0}</span>
        </div>
      </div>
      <div class="sim-view__end-actions">
        <Button variant="primary" on:click={start}>Restart</Button>
        <Button variant="ghost" on:click={() => { sim.reset(); navigate('/simulator'); }}>Choose New Scenario</Button>
      </div>
      <ProjectDashboard />
    </div>
  {:else}
    <div class="sim-view__body">
      <div class="sim-view__col sim-view__col--left">
        <PersonaPanel />
        <div class="sim-view__section">
          <ProjectDashboard />
        </div>
      </div>
      <div class="sim-view__col sim-view__col--center">
        <div class="sim-view__section">
          <Inbox />
        </div>
        <div class="sim-view__section">
          <DecisionPanel />
        </div>
        <div class="sim-view__section">
          <BlockerPanel />
        </div>
      </div>
      <div class="sim-view__col sim-view__col--right">
        <div class="sim-view__section">
          <EventLog />
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .sim-view { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
  .sim-view__top { display: flex; align-items: center; padding: var(--space-2) var(--space-4); border-bottom: 1px solid var(--color-border); background: var(--color-bg-surface); flex-shrink: 0; gap: var(--space-4); }
  .sim-view__top-left { flex: 0 0 auto; }
  .sim-view__top-center { flex: 1; }
  .sim-view__top-right { flex: 0 0 auto; }
  .sim-view__back { background: none; border: none; color: var(--color-text-secondary); cursor: pointer; font-family: var(--font-body); font-size: var(--text-sm); padding: var(--space-1) var(--space-2); }
  .sim-view__back:hover { color: var(--color-text); }
  .sim-view__status { font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.05em; padding: 2px var(--space-2); border-radius: var(--radius-sm); font-weight: 600; }
  .sim-view__status--live { background: rgba(63, 185, 80, 0.15); color: var(--color-green); }
  .sim-view__status--paused { background: rgba(210, 153, 34, 0.15); color: var(--color-yellow); }
  .sim-view__status--complete { background: rgba(63, 185, 80, 0.15); color: var(--color-green); }
  .sim-view__status--fail { background: rgba(248, 81, 73, 0.15); color: var(--color-red); }
  .sim-view__body { flex: 1; display: grid; grid-template-columns: 280px 1fr 260px; gap: 0; overflow: hidden; }
  .sim-view__col { overflow-y: auto; padding: var(--space-3); }
  .sim-view__col--left { border-right: 1px solid var(--color-border); background: var(--color-bg-surface); }
  .sim-view__col--center { }
  .sim-view__col--right { border-left: 1px solid var(--color-border); background: var(--color-bg-surface); }
  .sim-view__section { margin-bottom: var(--space-4); }
  .sim-view__section:last-child { margin-bottom: 0; }
  .sim-view__start { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-4); padding: var(--space-8); text-align: center; }
  .sim-view__start h2 { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 600; }
  .sim-view__start p { color: var(--color-text-secondary); max-width: 500px; line-height: 1.6; }
  .sim-view__start-actions { display: flex; gap: var(--space-3); margin-top: var(--space-4); }
  .sim-view__end { flex: 1; overflow-y: auto; padding: var(--space-8); max-width: 700px; margin: 0 auto; }
  .sim-view__end h2 { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 600; margin-bottom: var(--space-6); text-align: center; }
  .sim-view__end-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-6); }
  .sim-view__end-stat { padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-md); text-align: center; background: var(--color-bg-surface); }
  .sim-view__end-label { display: block; font-size: var(--text-xs); color: var(--color-text-secondary); margin-bottom: var(--space-1); }
  .sim-view__end-value { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 700; }
  .sim-view__end-actions { display: flex; gap: var(--space-3); justify-content: center; margin-bottom: var(--space-8); }
</style>
