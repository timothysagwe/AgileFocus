<script>
  export let variant = 'info';
  export let text = '';

  const variantMap = {
    info: 'badge--info',
    success: 'badge--success',
    warning: 'badge--warning',
    danger: 'badge--danger',
    regulatory: 'badge--regulatory',
    level: 'badge--level'
  };

  $: classes = ['badge', variantMap[variant] || 'badge--info'].join(' ');
</script>

<span class={classes} aria-label={text}>{text}</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    font-family: var(--font-display);
    font-size: var(--text-xs);
    font-weight: 500;
    padding: 2px var(--space-2);
    border-radius: var(--radius-sm);
    line-height: 1.4;
    white-space: nowrap;
  }

  .badge--info {
    background: rgba(88, 166, 255, 0.15);
    color: var(--color-accent-secondary);
  }
  .badge--success {
    background: rgba(63, 185, 80, 0.15);
    color: var(--color-accent-success);
  }
  .badge--warning {
    background: rgba(210, 153, 34, 0.15);
    color: var(--color-accent-warning);
  }
  .badge--danger {
    background: rgba(248, 81, 73, 0.15);
    color: var(--color-accent-danger);
  }
  .badge--regulatory {
    background: rgba(188, 140, 255, 0.15);
    color: var(--color-regulatory);
  }
  .badge--level {
    background: rgba(240, 136, 62, 0.15);
    color: var(--color-accent-primary);
  }
</style>
