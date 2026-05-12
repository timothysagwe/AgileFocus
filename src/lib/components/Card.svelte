<script>
  export let variant = 'default';
  export let clickable = false;
  export let elevated = false;

  const variantBorders = {
    default: '',
    regulatory: 'card--regulatory',
    warning: 'card--warning',
    success: 'card--success'
  };

  $: classes = [
    'card',
    variantBorders[variant] || '',
    clickable ? 'card--clickable' : '',
    elevated ? 'card--elevated' : ''
  ].filter(Boolean).join(' ');
</script>

<button class={classes} on:click tabindex={clickable ? '0' : '-1'}>
  <slot />
</button>

<style>
  .card {
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    display: block;
    text-align: left;
    width: 100%;
    cursor: default;
    font-family: var(--font-body);
    color: var(--color-text-primary);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);
  }

  .card--regulatory {
    border-color: var(--color-regulatory);
  }
  .card--warning {
    border-color: var(--color-accent-warning);
  }
  .card--success {
    border-color: var(--color-accent-success);
  }

  .card--elevated {
    box-shadow: var(--shadow-md);
  }

  .card--clickable {
    cursor: pointer;
  }
  .card--clickable:hover {
    border-color: var(--color-accent-primary);
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
  .card--clickable:focus-visible {
    outline: 2px solid var(--color-accent-secondary);
    outline-offset: 2px;
  }
  .card--clickable.card--regulatory:hover {
    border-color: var(--color-regulatory);
  }
</style>
