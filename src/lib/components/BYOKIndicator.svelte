<script>
  import { settings } from '../stores/settings.js';
  import { navigate } from '../router.js';

  $: active = $settings.byok_active;
</script>

{#if active}
  <button class="byok-indicator" on:click={() => navigate('/settings')} title="AI features active — click for settings">
    <span class="byok-indicator__dot"></span>
    <span class="byok-indicator__label">AI Active</span>
  </button>
{/if}

<style>
  .byok-indicator {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    background: rgba(240, 136, 62, 0.12);
    border: 1px solid rgba(240, 136, 62, 0.3);
    border-radius: var(--radius-sm);
    padding: 2px var(--space-2);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 10px;
    color: var(--color-accent-primary);
    transition: background var(--transition-fast);
  }

  .byok-indicator:hover {
    background: rgba(240, 136, 62, 0.2);
  }

  .byok-indicator__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-accent-primary);
    animation: pulse-dot 2s infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .byok-indicator__label {
    font-family: var(--font-display);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
</style>
