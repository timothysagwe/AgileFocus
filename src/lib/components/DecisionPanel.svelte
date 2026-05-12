<script>
  import { sim, decisions } from '../stores/state.js';
</script>

<div class="panel">
  <header class="panel-header">
    <h2>Decisions Required</h2>
    {#if $decisions.length > 0}
      <span class="badge">{$decisions.length}</span>
    {/if}
  </header>

  <div class="decision-list">
    {#if $decisions.length === 0}
      <div class="empty-state">
        <p>No pending decisions</p>
      </div>
    {:else}
      {#each $decisions as decision (decision.id)}
        <div class="decision-card">
          <div class="decision-header">
            <span class="time">{decision.time}</span>
          </div>
          <div class="subject">{decision.subject}</div>
          {#if decision.options?.length > 0}
            <div class="options">
              {#each decision.options as opt}
                <span class="option">{opt}</span>
              {/each}
            </div>
          {/if}
          <button class="btn-primary" on:click={() => $sim.makeDecision(decision.id)}>
            Resolve
          </button>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .panel {
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .panel-header h2 {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text);
  }

  .badge {
    background: var(--color-purple);
    color: var(--color-bg);
    font-size: var(--text-xs);
    font-weight: 600;
    padding: var(--space-1) var(--space-2);
    border-radius: 999px;
    min-width: 20px;
    text-align: center;
  }

  .decision-list {
    overflow-y: auto;
    flex: 1;
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .empty-state {
    padding: var(--space-8);
    text-align: center;
    color: var(--color-text-muted);
  }

  .decision-card {
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-left: 3px solid var(--color-purple);
    border-radius: var(--radius-md);
    padding: var(--space-4);
  }

  .decision-header {
    margin-bottom: var(--space-2);
  }

  .time {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .subject {
    font-weight: 600;
    font-size: var(--text-sm);
    color: var(--color-text);
    margin-bottom: var(--space-3);
  }

  .options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .option {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    padding: var(--space-1) var(--space-2);
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
  }

  button {
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    font-weight: 500;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-primary {
    background: var(--color-purple);
    color: var(--color-bg);
  }

  .btn-primary:hover {
    background: color-mix(in srgb, var(--color-purple) 85%, white);
  }
</style>
