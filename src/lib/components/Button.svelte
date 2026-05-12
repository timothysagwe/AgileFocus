<script>
  export let variant = 'primary';
  export let size = 'md';
  export let disabled = false;

  const variants = {
    primary: 'btn--primary',
    secondary: 'btn--secondary',
    ghost: 'btn--ghost',
    danger: 'btn--danger'
  };

  const sizes = {
    sm: 'btn--sm',
    md: 'btn--md',
    lg: 'btn--lg'
  };
</script>

<button
  class="btn {variants[variant] || 'btn--primary'} {sizes[size] || 'btn--md'}"
  {disabled}
  on:click
>
  <slot />
</button>

<style>
  .btn {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background var(--transition-fast), border-color var(--transition-fast);
    border: 1px solid transparent;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn--sm { padding: var(--space-1) var(--space-2); font-size: var(--text-xs); }
  .btn--md { padding: var(--space-2) var(--space-3); }
  .btn--lg { padding: var(--space-3) var(--space-5); font-size: var(--text-base); }
  .btn--primary { background: var(--color-accent); color: #fff; }
  .btn--primary:hover:not(:disabled) { background: var(--color-accent-hover); }
  .btn--secondary { background: var(--color-bg-elevated); color: var(--color-text); border-color: var(--color-border); }
  .btn--secondary:hover:not(:disabled) { border-color: var(--color-accent); }
  .btn--ghost { background: transparent; color: var(--color-text-secondary); }
  .btn--ghost:hover:not(:disabled) { color: var(--color-text); background: var(--color-bg-surface); }
  .btn--danger { background: var(--color-red); color: #fff; }
  .btn--danger:hover:not(:disabled) { opacity: 0.9; }
</style>
