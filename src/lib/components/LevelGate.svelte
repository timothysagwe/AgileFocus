<script>
  import Card from './Card.svelte';
  import Button from './Button.svelte';

  export let required_level = 1;
  export let current_level = 1;

  $: locked = current_level < required_level;
</script>

{#if locked}
  <div class="level-gate" role="region" aria-label="Content locked">
    <div class="level-gate__overlay">
      <Card variant="warning">
        <div class="level-gate__content">
          <span class="level-gate__icon" aria-hidden="true">&#x1F512;</span>
          <strong class="level-gate__title">Level {required_level} Required</strong>
          <p class="level-gate__desc">Complete Level {required_level} to unlock this content.</p>
          <Button variant="primary" size="sm" href="/learn">Go to Exercises</Button>
        </div>
      </Card>
    </div>
  </div>
{:else}
  <slot />
{/if}

<style>
  .level-gate {
    position: relative;
  }

  .level-gate__overlay {
    filter: blur(1px);
    pointer-events: auto;
  }

  .level-gate__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    text-align: center;
    padding: var(--space-8);
  }

  .level-gate__icon {
    font-size: var(--text-4xl);
  }

  .level-gate__title {
    font-family: var(--font-display);
    font-size: var(--text-xl);
  }

  .level-gate__desc {
    color: var(--color-text-secondary);
    font-size: var(--text-sm);
  }
</style>
