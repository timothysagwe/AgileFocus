<script>
  import { navigate } from '../lib/router.js';
  import { getAllScenarios } from '../lib/engines/scenario-engine.js';
  import { sim } from '../lib/stores/state.js';

  $: scenarios = getAllScenarios();

  function startScenario(id) {
    sim.loadScenario(id);
    navigate(`/simulator/${id}`);
  }
</script>

<div class="landing">
  <section class="hero">
    <div class="hero__content">
      <h1 class="hero__title">AgileFocus</h1>
      <p class="hero__tagline">Workday Simulator for Project Managers & Business Analysts</p>
      <p class="hero__desc">
        A continuous, pressure-driven simulation of real work in regulated environments.
        Receive messages, attend meetings, make decisions under pressure, and manage stakeholders.
      </p>
    </div>
  </section>

  <section class="scenarios">
    <h2 class="section-title">Scenarios</h2>
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
            <span class="scenario-card__role-label">Role:</span>
            <span>{s.role === 'pm' ? 'Project Manager' : 'Business Analyst'}</span>
          </div>
        </div>
      {/each}
    </div>
  </section>
</div>

<style>
  .landing { padding: var(--space-8) var(--space-6); max-width: 800px; margin: 0 auto; }
  .hero { text-align: center; padding: var(--space-12) 0; }
  .hero__title { font-family: var(--font-display); font-size: var(--text-3xl); font-weight: 700; letter-spacing: -0.02em; }
  .hero__tagline { font-size: var(--text-lg); color: var(--color-text-secondary); margin: var(--space-3) 0; }
  .hero__desc { font-size: var(--text-base); color: var(--color-text-secondary); max-width: 600px; margin: 0 auto; line-height: 1.6; }
  .section-title { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 600; margin-bottom: var(--space-6); }
  .scenario-list { display: flex; flex-direction: column; gap: var(--space-4); }
  .scenario-card { padding: var(--space-5); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-bg-surface); cursor: pointer; transition: border-color var(--transition-fast), transform var(--transition-fast); }
  .scenario-card:hover { border-color: var(--color-accent); transform: translateY(-1px); }
  .scenario-card__header { display: flex; gap: var(--space-3); margin-bottom: var(--space-3); }
  .scenario-card__difficulty { font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.05em; padding: 2px var(--space-2); border-radius: var(--radius-sm); }
  .scenario-card__difficulty--intermediate { background: rgba(210, 153, 34, 0.15); color: var(--color-yellow); }
  .scenario-card__days { font-size: var(--text-xs); color: var(--color-text-muted); }
  .scenario-card__title { font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-2); }
  .scenario-card__desc { font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.6; margin-bottom: var(--space-3); }
  .scenario-card__role { display: flex; gap: var(--space-2); font-size: var(--text-sm); color: var(--color-text-secondary); }
  .scenario-card__role-label { color: var(--color-text-muted); }
</style>
