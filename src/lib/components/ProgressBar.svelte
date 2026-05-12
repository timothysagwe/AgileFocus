<script>
  export let value = 0;
  export let label = '';
  export let variant = 'default';

  $: clamped = Math.min(100, Math.max(0, Number(value) || 0));
  $: progressClasses = ['progress', variant === 'regulatory' ? 'progress--regulatory' : ''].filter(Boolean).join(' ');
</script>

<div class={progressClasses} role="progressbar" aria-valuenow={clamped} aria-valuemin="0" aria-valuemax="100" aria-label={label || 'Progress'}>
  {#if label}
    <span class="progress__label">{label}</span>
  {/if}
  <div class="progress__track">
    <div class="progress__fill" style="width: {clamped}%"></div>
  </div>
  <span class="progress__pct">{clamped}%</span>
</div>

<style>
  .progress {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-family: var(--font-display);
    font-size: var(--text-sm);
  }

  .progress__label {
    color: var(--color-text-secondary);
    min-width: fit-content;
  }

  .progress__track {
    flex: 1;
    height: 6px;
    background: var(--color-bg-secondary);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress__fill {
    height: 100%;
    background: var(--color-accent-primary);
    border-radius: 3px;
    transition: width var(--transition-base);
  }

  .progress--regulatory .progress__fill {
    background: var(--color-regulatory);
  }

  .progress__pct {
    color: var(--color-text-secondary);
    min-width: 3ch;
    text-align: right;
  }
</style>
