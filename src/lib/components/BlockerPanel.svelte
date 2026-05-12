<script>
  import { sim, blockers } from '../stores/state.js';
  import { getPersona } from '../engines/persona-engine.js';

  function getPersonaName(senderId) {
    if (senderId === 'system') return 'System';
    const p = getPersona(senderId);
    return p ? p.name : senderId;
  }
</script>

<div class="panel">
  <header class="panel-header">
    <h2>Active Blockers</h2>
    {#if $blockers.length > 0}
      <span class="badge">{$blockers.length}</span>
    {/if}
  </header>

  <div class="blocker-list">
    {#if $blockers.length === 0}
      <div class="empty-state">
        <p>No active blockers</p>
      </div>
    {:else}
      {#each $blockers as blocker (blocker.id)}
        <div class="blocker-card">
          <div class="blocker-header">
            <span class="from">{getPersonaName(blocker.from)}</span>
            <span class="time">{blocker.time}</span>
          </div>
          <div class="subject">{blocker.subject}</div>
          <button class="btn-primary" on:click={() => $sim.resolveBlocker(blocker.id)}>
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
    background: var(--color-red);
    color: var(--color-bg);
    font-size: var(--text-xs);
    font-weight: 600;
    padding: var(--space-1) var(--space-2);
    border-radius: 999px;
    min-width: 20px;
    text-align: center;
  }

  .blocker-list {
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

  .blocker-card {
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-left: 3px solid var(--color-red);
    border-radius: var(--radius-md);
    padding: var(--space-4);
  }

  .blocker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-2);
  }

  .from {
    font-weight: 600;
    font-size: var(--text-sm);
    color: var(--color-text);
  }

  .time {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .subject {
    font-weight: 500;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-3);
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
    background: var(--color-red);
    color: var(--color-bg);
  }

  .btn-primary:hover {
    background: color-mix(in srgb, var(--color-red) 85%, white);
  }
</style>
