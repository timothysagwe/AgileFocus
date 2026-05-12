<script>
  export let variant = 'info';
  export let dismissible = false;
  export let title = '';
  export let message = '';

  let visible = true;

  function dismiss() {
    visible = false;
  }

  $: icon = variant === 'info' ? '\u2139\uFE0F' : variant === 'success' ? '\u2714\uFE0F' : variant === 'warning' ? '\u26A0\uFE0F' : '\u2716\uFE0F';
</script>

{#if visible}
  <div class="alert alert--{variant}" role="alert">
    <span class="alert__icon" aria-hidden="true">{icon}</span>
    <div class="alert__content">
      {#if title}
        <strong class="alert__title">{title}</strong>
      {/if}
      {#if message}
        <p class="alert__message">{message}</p>
      {/if}
      <slot />
    </div>
    {#if dismissible}
      <button class="alert__dismiss" on:click={dismiss} aria-label="Dismiss alert">&times;</button>
    {/if}
  </div>
{/if}

<style>
  .alert {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    border: 1px solid;
    font-size: var(--text-sm);
  }

  .alert__icon {
    flex-shrink: 0;
    font-size: var(--text-lg);
    line-height: 1.4;
  }

  .alert__content {
    flex: 1;
  }

  .alert__title {
    display: block;
    font-family: var(--font-display);
    font-weight: 600;
    margin-bottom: var(--space-1);
  }

  .alert__message {
    color: var(--color-text-secondary);
    margin: 0;
  }

  .alert__dismiss {
    flex-shrink: 0;
    background: none;
    border: none;
    color: inherit;
    font-size: var(--text-lg);
    cursor: pointer;
    padding: 0 var(--space-1);
    line-height: 1;
    opacity: 0.6;
    transition: opacity var(--transition-fast);
  }
  .alert__dismiss:hover {
    opacity: 1;
  }

  .alert--info {
    background: rgba(88, 166, 255, 0.08);
    border-color: rgba(88, 166, 255, 0.25);
    color: var(--color-accent-secondary);
  }

  .alert--success {
    background: rgba(63, 185, 80, 0.08);
    border-color: rgba(63, 185, 80, 0.25);
    color: var(--color-accent-success);
  }

  .alert--warning {
    background: rgba(210, 153, 34, 0.08);
    border-color: rgba(210, 153, 34, 0.25);
    color: var(--color-accent-warning);
  }

  .alert--danger {
    background: rgba(248, 81, 73, 0.08);
    border-color: rgba(248, 81, 73, 0.25);
    color: var(--color-accent-danger);
  }
</style>
