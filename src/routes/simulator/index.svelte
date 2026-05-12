<script>
  import { progress } from '../../lib/stores/progress.js';
  import Card from '../../lib/components/Card.svelte';
  import Badge from '../../lib/components/Badge.svelte';
  import Button from '../../lib/components/Button.svelte';
  import LevelGate from '../../lib/components/LevelGate.svelte';
  import { navigate } from '../../lib/router.js';
  import scenariosIndex from '../../data/scenarios/index.json';

  $: completedIds = $progress.completed_simulations || [];
</script>

<div class="sim-hub">
  <header class="hub__header">
    <h1>Simulations</h1>
    <p class="hub__summary">{completedIds.length} of {scenariosIndex.length} complete</p>
  </header>

  <p class="hub__intro">
    Run scenario-based simulations to practise IT Project Management and Business Analysis
    in realistic regulated environments. Each simulation runs across multiple sprints with
    live persona interactions, injected events, and scored decision points.
  </p>

  <div class="hub__cards">
    {#each scenariosIndex as scenario (scenario.id)}
      <LevelGate required_level={scenario.level_required} current_level={$progress.level}>
        <Card variant={completedIds.includes(scenario.id) ? 'success' : 'default'}>
          <div class="hub__card-content">
            <div class="hub__card-meta">
              <Badge variant="level" text="Level {scenario.level_required}" />
              <Badge variant="info" text={scenario.duration} />
              {#if completedIds.includes(scenario.id)}
                <Badge variant="success" text="Complete" />
              {/if}
            </div>
            <h3 class="hub__card-title">{scenario.title}</h3>
            <p class="hub__card-desc">{scenario.description}</p>
            <div class="hub__card-details">
              <span class="hub__detail"><strong>Organisation:</strong> {scenario.organisation}</span>
              <span class="hub__detail"><strong>Focus:</strong> {scenario.focus_areas.join(' · ')}</span>
              <span class="hub__detail"><strong>Personas:</strong> {scenario.personas.join(' · ')}</span>
            </div>
            <Button variant="primary" size="sm" on:click={() => navigate('/simulator/' + scenario.id)}>
              {completedIds.includes(scenario.id) ? 'Replay' : 'Start Simulation'}
            </Button>
          </div>
        </Card>
      </LevelGate>
    {/each}
  </div>
</div>

<style>
  .sim-hub {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }

  .hub__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .hub__summary {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .hub__intro {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    max-width: 640px;
    line-height: 1.6;
  }

  .hub__cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .hub__card-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .hub__card-meta {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .hub__card-title {
    font-size: var(--text-lg);
  }

  .hub__card-desc {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .hub__card-details {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .hub__detail strong {
    color: var(--color-text-primary);
  }
</style>
