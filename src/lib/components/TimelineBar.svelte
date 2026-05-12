<script>
  import { sim, timeline } from '../stores/state.js';

  function formatTime(hour, minute) {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  function getProgressPercent() {
    const t = $timeline;
    const startHour = 9;
    const endHour = 18;
    const totalMinutes = (endHour - startHour) * 60;
    const currentMinutes = (t.hour - startHour) * 60 + t.minute;
    return Math.max(0, Math.min(100, (currentMinutes / totalMinutes) * 100));
  }

  function isRunning() {
    return $sim.phase === 'running';
  }
</script>

<div class="timeline-bar">
  <div class="time-info">
    <div class="current-time">{formatTime($timeline.hour, $timeline.minute)}</div>
    <div class="metadata">
      <span class="pill">Day {$timeline.day}</span>
      <span class="pill">Sprint {$timeline.sprint}</span>
    </div>
  </div>

  <div class="progress-container">
    <div class="time-marker">09:00</div>
    <div class="progress-track">
      <div class="progress-fill" style="width: {getProgressPercent()}%"></div>
      <div class="progress-now" style="left: {getProgressPercent()}%"></div>
    </div>
    <div class="time-marker">18:00</div>
  </div>

  <div class="controls">
    {#if isRunning()}
      <button class="control-btn pause" on:click={() => $sim.pause()}>
        <span class="icon">
          <span class="bar"></span>
          <span class="bar"></span>
        </span>
        Pause
      </button>
    {:else if $sim.phase === 'paused'}
      <button class="control-btn play" on:click={() => $sim.resume()}>
        <span class="icon play-icon"></span>
        Resume
      </button>
    {:else}
      <button class="control-btn play" disabled>
        <span class="icon play-icon"></span>
        Play
      </button>
    {/if}
    <button class="control-btn stop" on:click={() => $sim.stop()}>
      <span class="icon square"></span>
      Stop
    </button>
  </div>
</div>

<style>
  .timeline-bar {
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    display: flex;
    align-items: center;
    gap: var(--space-6);
  }

  .time-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 100px;
  }

  .current-time {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--color-accent);
    font-variant-numeric: tabular-nums;
  }

  .metadata {
    display: flex;
    gap: var(--space-2);
  }

  .pill {
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--color-text-secondary);
    padding: var(--space-1) var(--space-2);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
  }

  .progress-container {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .time-marker {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
    min-width: 36px;
  }

  .progress-track {
    flex: 1;
    position: relative;
    height: 8px;
    background: var(--color-bg);
    border-radius: 4px;
  }

  .progress-fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: var(--color-accent);
    border-radius: 4px;
    transition: width var(--transition-fast);
  }

  .progress-now {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    margin-top: -6px;
    margin-left: -6px;
    background: var(--color-accent);
    border: 2px solid var(--color-bg);
    border-radius: 50%;
    box-shadow: 0 0 0 2px var(--color-accent);
    transition: left var(--transition-fast);
  }

  .controls {
    display: flex;
    gap: var(--space-2);
  }

  .control-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    font-weight: 500;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-border);
    background: var(--color-bg-elevated);
    color: var(--color-text);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .control-btn:hover:not(:disabled) {
    background: var(--color-bg-surface);
    border-color: var(--color-text-muted);
  }

  .control-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .control-btn.play {
    border-color: var(--color-green);
    color: var(--color-green);
  }

  .control-btn.play:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-green) 15%, transparent);
  }

  .control-btn.pause {
    border-color: var(--color-yellow);
    color: var(--color-yellow);
  }

  .control-btn.pause:hover {
    background: color-mix(in srgb, var(--color-yellow) 15%, transparent);
  }

  .control-btn.stop {
    border-color: var(--color-red);
    color: var(--color-red);
  }

  .control-btn.stop:hover {
    background: color-mix(in srgb, var(--color-red) 15%, transparent);
  }

  .icon {
    display: flex;
    gap: 3px;
  }

  .icon .bar {
    width: 3px;
    height: 12px;
    background: currentColor;
    border-radius: 1px;
  }

  .icon.play-icon {
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 6px 0 6px 10px;
    border-color: transparent transparent transparent currentColor;
  }

  .icon.square {
    width: 10px;
    height: 10px;
    background: currentColor;
    border-radius: 2px;
  }
</style>
