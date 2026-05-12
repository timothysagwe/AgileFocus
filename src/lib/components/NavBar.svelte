<script>
  import { navigate, getPath, onPathChange } from '../router.js';
  import { onMount, onDestroy } from 'svelte';

  let currentPath = '/';

  function updatePath() {
    currentPath = getPath();
  }

  let unsub;
  onMount(() => {
    updatePath();
    unsub = onPathChange(updatePath);
  });

  onDestroy(() => { if (unsub) unsub(); });
</script>

<nav>
  <div class="nav-inner">
    <a class="brand" href="/" on:click|preventDefault={() => navigate('/')}>
      AgileFocus
    </a>
    <div class="links">
      <a 
        href="/simulator" 
        class:active={currentPath === '/simulator' || currentPath.startsWith('/simulator/')}
        on:click|preventDefault={() => navigate('/simulator')}
      >
        Simulator
      </a>
      <a 
        href="/settings" 
        class:active={currentPath === '/settings'}
        on:click|preventDefault={() => navigate('/settings')}
      >
        Settings
      </a>
    </div>
  </div>
</nav>

<style>
  nav {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: var(--color-bg-surface);
    border-bottom: 1px solid var(--color-border);
    height: 48px;
  }

  .nav-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 var(--space-4);
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .brand {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--color-accent);
    text-decoration: none;
  }

  .links {
    display: flex;
    gap: var(--space-6);
  }

  .links a {
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: var(--text-sm);
    font-weight: 500;
    padding: var(--space-2) 0;
    border-bottom: 2px solid transparent;
    transition: color var(--transition-fast), border-color var(--transition-fast);
  }

  .links a:hover {
    color: var(--color-text);
  }

  .links a.active {
    color: var(--color-text);
    border-bottom-color: var(--color-accent);
  }
</style>
