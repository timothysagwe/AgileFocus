<script>
  import { eventLog } from '../stores/state.js';
  import { tick, afterUpdate } from 'svelte';

  let logContainer;

  async function scrollToBottom() {
    await tick();
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }

  afterUpdate(() => {
    scrollToBottom();
  });

  function getTypeColor(type) {
    switch (type) {
      case 'incoming_message':
      case 'message_response':
        return 'var(--color-blue)';
      case 'blocker':
      case 'blocker_added':
        return 'var(--color-red)';
      case 'blocker_resolved':
        return 'var(--color-green)';
      case 'decision':
      case 'decision_made':
        return 'var(--color-purple)';
      case 'meeting':
        return 'var(--color-yellow)';
      case 'day_start':
      case 'day_end':
      case 'simulation_end':
        return 'var(--color-accent)';
      default:
        return 'var(--color-text-muted)';
    }
  }

  function formatType(type) {
    return type.replace(/_/g, ' ');
  }

  function getDescription(event) {
    const d = event.data || {};
    switch (event.type) {
      case 'incoming_message':
        return `${d.from || 'Unknown'}: ${d.subject || 'New message'}`;
      case 'message_response':
        return `Responded to message`;
      case 'blocker':
      case 'blocker_added':
        return d.subject || 'Blocker raised';
      case 'blocker_resolved':
        return 'Blocker resolved';
      case 'decision':
        return d.subject || 'Decision required';
      case 'decision_made':
        return 'Decision resolved';
      case 'meeting':
        return `${d.type || 'Meeting'} scheduled`;
      case 'day_start':
        return `Day ${d.day || event.day} started`;
      case 'day_end':
        return `Day ${event.day || '?'} ended`;
      case 'simulation_end':
        return 'Simulation ended';
      default:
        return d.subject || d.type || formatType(event.type);
    }
  }
</script>

<div class="panel">
  <header class="panel-header">
    <h2>Event Log</h2>
    <span class="count">Last {$eventLog.length}</span>
  </header>

  <div class="log-container" bind:this={logContainer}>
    {#if $eventLog.length === 0}
      <div class="empty-state">
        <p>No events yet</p>
      </div>
    {:else}
      {#each $eventLog as event (event.timestamp || event.time + '-' + event.type)}
        <div class="log-entry">
          <div class="entry-time">
            <span class="time">{event.time}</span>
            <span class="day">D{event.day || 1}</span>
          </div>
          <div class="entry-type" style="--tc: {getTypeColor(event.type)}">
            {formatType(event.type)}
          </div>
          <div class="entry-desc">{getDescription(event)}</div>
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
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .panel-header h2 {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text);
  }

  .count {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .log-container {
    overflow-y: auto;
    flex: 1;
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .empty-state {
    padding: var(--space-8);
    text-align: center;
    color: var(--color-text-muted);
  }

  .log-entry {
    display: grid;
    grid-template-columns: 70px 110px 1fr;
    gap: var(--space-3);
    align-items: baseline;
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-elevated);
    border-radius: var(--radius-sm);
    font-size: var(--text-xs);
  }

  .log-entry:hover {
    background: color-mix(in srgb, var(--color-bg-elevated) 80%, var(--color-bg-surface));
  }

  .entry-time {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .time {
    color: var(--color-text);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  .day {
    color: var(--color-text-muted);
    font-size: 10px;
  }

  .entry-type {
    font-weight: 600;
    text-transform: lowercase;
    color: var(--tc);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .entry-desc {
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
