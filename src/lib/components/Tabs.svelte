<script>
  import { createEventDispatcher } from 'svelte';
  import Badge from './Badge.svelte';

  export let tabs = [];
  export let active = undefined;

  const dispatch = createEventDispatcher();

  $: activeTab = active !== undefined ? active : (tabs[0]?.id || null);

  function select(id) {
    activeTab = id;
    dispatch('tabChange', id);
  }
</script>

<div class="tabs" role="tablist" aria-label="Content tabs">
  {#each tabs as tab (tab.id)}
    <button
      class="tabs__tab"
      class:tabs__tab--active={activeTab === tab.id}
      role="tab"
      aria-selected={activeTab === tab.id}
      on:click={() => select(tab.id)}
    >
      {tab.label}
      {#if tab.badge}
        <Badge variant="info" text={tab.badge} />
      {/if}
    </button>
  {/each}
</div>

<style>
  .tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--color-border);
  }

  .tabs__tab {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-5);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-text-secondary);
    font-family: var(--font-display);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: color var(--transition-fast), border-color var(--transition-fast);
    margin-bottom: -1px;
  }

  .tabs__tab:hover {
    color: var(--color-text-primary);
  }

  .tabs__tab--active {
    color: var(--color-accent-primary);
    border-bottom-color: var(--color-accent-primary);
  }
</style>
