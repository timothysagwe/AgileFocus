<script>
  import { navigate } from '../router.js';

  export let variant = 'primary';
  export let size = 'md';
  export let disabled = false;
  export let loading = false;
  export let href = undefined;

  const classMap = {
    base: 'btn',
    variant: `btn--${variant}`,
    size: `btn--${size}`,
    loading: loading ? 'btn--loading' : '',
    disabled: disabled ? 'btn--disabled' : ''
  };

  $: classes = Object.values(classMap).filter(Boolean).join(' ');
  $: isDisabled = disabled || loading;

  function onClick(e) {
    if (href && !isDisabled && !(e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      navigate(href);
    }
  }
</script>

{#if href}
  <a {href} class={classes} class:btn--disabled={isDisabled} role="button" aria-disabled={isDisabled} on:click={onClick}>
    {#if loading}
      <span class="btn__dots"><span>.</span><span>.</span><span>.</span></span>
    {:else}
      <slot />
    {/if}
  </a>
{:else}
  <button class={classes} {disabled} aria-busy={loading} on:click>
    {#if loading}
      <span class="btn__dots"><span>.</span><span>.</span><span>.</span></span>
    {:else}
      <slot />
    {/if}
  </button>
{/if}

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-family: var(--font-body);
    font-weight: 500;
    transition: background var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
    text-decoration: none;
    white-space: nowrap;
    line-height: 1;
  }
  .btn:focus-visible {
    outline: 2px solid var(--color-accent-secondary);
    outline-offset: 2px;
  }

  .btn--sm {
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-sm);
  }
  .btn--md {
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-base);
  }
  .btn--lg {
    padding: var(--space-3) var(--space-6);
    font-size: var(--text-lg);
  }

  .btn--primary {
    background: var(--color-accent-primary);
    color: var(--color-bg-primary);
    border-color: var(--color-accent-primary);
  }
  .btn--primary:hover:not(:disabled) {
    background: #f29e56;
    border-color: #f29e56;
  }

  .btn--secondary {
    background: transparent;
    color: var(--color-text-primary);
    border-color: var(--color-border);
  }
  .btn--secondary:hover:not(:disabled) {
    background: var(--color-bg-surface);
    border-color: var(--color-text-secondary);
  }

  .btn--danger {
    background: var(--color-accent-danger);
    color: #fff;
    border-color: var(--color-accent-danger);
  }
  .btn--danger:hover:not(:disabled) {
    background: #ff6b5e;
    border-color: #ff6b5e;
  }

  .btn--ghost {
    background: transparent;
    color: var(--color-text-secondary);
    border-color: transparent;
  }
  .btn--ghost:hover:not(:disabled) {
    color: var(--color-text-primary);
    background: var(--color-bg-surface);
  }

  .btn--disabled,
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }

  .btn--loading {
    pointer-events: none;
  }

  .btn__dots {
    display: inline-flex;
    gap: 2px;
  }
  .btn__dots span {
    animation: dot-pulse 1.2s infinite;
    font-weight: 700;
  }
  .btn__dots span:nth-child(2) { animation-delay: 0.2s; }
  .btn__dots span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes dot-pulse {
    0%, 80%, 100% { opacity: 0.3; }
    40% { opacity: 1; }
  }
</style>
