<script>
  import { onMount } from 'svelte';
  import { progress } from '../../lib/stores/progress.js';
  import { getExercises } from '../../lib/bpmn-data.js';
  import Card from '../../lib/components/Card.svelte';
  import Badge from '../../lib/components/Badge.svelte';
  import Button from '../../lib/components/Button.svelte';
  import LevelGate from '../../lib/components/LevelGate.svelte';
  import Link from '../../lib/components/Link.svelte';

  let exercises = [];

  onMount(() => {
    exercises = getExercises();
  });

  $: completedIds = $progress.completed_exercises || [];
  $: completedCount = exercises.filter(e => completedIds.includes(e.id)).length;
  $: totalCount = exercises.length;

  $: grouped = groupByTier(exercises);

  function groupByTier(exs) {
    const map = {};
    for (const ex of exs) {
      const t = ex.tier || 1;
      if (!map[t]) map[t] = [];
      map[t].push(ex);
    }
    return Object.keys(map).sort((a, b) => a - b).map(key => ({ tier: Number(key), exercises: map[key] }));
  }
</script>

<div class="bpmn-hub">
  <header class="hub__header">
    <h1>BPMN Exercises</h1>
    <p class="hub__summary">{completedCount} of {totalCount} complete</p>
  </header>

  {#each grouped as group (group.tier)}
    <section class="hub__tier">
      <div class="hub__tier-header">
        <Badge variant="level" text="Tier {group.tier}" />
        <span class="hub__tier-count">{group.exercises.length} exercise(s)</span>
      </div>

      {#if group.tier >= 4}
        <LevelGate required_level={3} current_level={$progress.level}>
          <div class="hub__cards">
            {#each group.exercises as ex (ex.id)}
              <Card variant={completedIds.includes(ex.id) ? 'success' : 'default'}>
                <div class="hub__card-content">
                  <div class="hub__card-meta">
                    <Badge variant="level" text="Level {ex.level_required}" />
                    {#if completedIds.includes(ex.id)}
                      <Badge variant="success" text="Complete" />
                    {/if}
                  </div>
                  <h3 class="hub__card-title">{ex.title}</h3>
                  <p class="hub__card-context">{ex.context}</p>
                  <Link href="/bpmn/{ex.id}">
                    <Button variant="primary" size="sm">Start Exercise</Button>
                  </Link>
                </div>
              </Card>
            {/each}
          </div>
        </LevelGate>
      {:else}
        <div class="hub__cards">
          {#each group.exercises as ex (ex.id)}
            <Card variant={completedIds.includes(ex.id) ? 'success' : 'default'}>
              <div class="hub__card-content">
                <div class="hub__card-meta">
                  <Badge variant="level" text="Level {ex.level_required}" />
                  {#if completedIds.includes(ex.id)}
                    <Badge variant="success" text="Complete" />
                  {/if}
                </div>
                <h3 class="hub__card-title">{ex.title}</h3>
                <p class="hub__card-context">{ex.context}</p>
                <Link href="/bpmn/{ex.id}">
                  <Button variant="primary" size="sm">Start Exercise</Button>
                </Link>
              </div>
            </Card>
          {/each}
        </div>
      {/if}
    </section>
  {/each}
</div>

<style>
  .bpmn-hub {
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
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

  .hub__tier {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .hub__tier-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .hub__tier-count {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .hub__cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
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
  }

  .hub__card-title {
    font-size: var(--text-lg);
  }

  .hub__card-context {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
