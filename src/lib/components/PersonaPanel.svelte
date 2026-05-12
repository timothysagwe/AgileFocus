<script>
  import { trustScores } from '../stores/state.js';
  import { getAllPersonas } from '../engines/persona-engine.js';

  const personas = getAllPersonas();

  function getTrustColor(score) {
    if (score > 70) return 'var(--color-green)';
    if (score >= 40) return 'var(--color-yellow)';
    if (score >= 20) return 'var(--color-accent)';
    return 'var(--color-red)';
  }

  function getTrustLabel(score) {
    if (score > 70) return 'Allied';
    if (score >= 40) return 'Neutral';
    if (score >= 20) return 'Resistant';
    return 'Hostile';
  }
</script>

<div class="panel">
  <header class="panel-header">
    <h2>Team Trust</h2>
  </header>

  <div class="persona-list">
    {#each personas as persona (persona.id)}
      {@const score = $trustScores[persona.id] ?? 50}
      {@const color = getTrustColor(score)}
      <div class="persona-card">
        <div class="avatar" style="--ac: {color}">{persona.avatar}</div>
        <div class="persona-info">
          <div class="name-row">
            <span class="name">{persona.name}</span>
            <span class="trust-label" style="--tc: {color}">{getTrustLabel(score)}</span>
          </div>
          <div class="role">{persona.role}</div>
          <div class="trust-bar">
            <div class="track"></div>
            <div class="fill" style="width: {score}%; --fc: {color}"></div>
          </div>
          <div class="score-text">{score}%</div>
        </div>
      </div>
    {/each}
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

  .persona-list {
    overflow-y: auto;
    flex: 1;
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .persona-card {
    display: flex;
    gap: var(--space-3);
    align-items: flex-start;
    padding: var(--space-3);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--ac) 20%, transparent);
    border: 2px solid var(--ac);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: var(--text-sm);
    color: var(--ac);
    flex-shrink: 0;
  }

  .persona-info {
    flex: 1;
    min-width: 0;
  }

  .name-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: var(--space-1);
  }

  .name {
    font-weight: 600;
    font-size: var(--text-sm);
    color: var(--color-text);
  }

  .trust-label {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: lowercase;
    color: var(--tc);
  }

  .role {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin-bottom: var(--space-3);
  }

  .trust-bar {
    position: relative;
    height: 6px;
    margin-bottom: var(--space-1);
  }

  .track {
    position: absolute;
    inset: 0;
    background: var(--color-bg);
    border-radius: 3px;
  }

  .fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: var(--fc);
    border-radius: 3px;
    transition: width var(--transition-fast);
  }

  .score-text {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    text-align: right;
  }
</style>
