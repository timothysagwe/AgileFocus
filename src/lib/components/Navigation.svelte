<script>
  import { progress } from '../stores/progress.js';
  import { getPath, navigate } from '../router.js';
  import Badge from './Badge.svelte';
  import BYOKIndicator from './BYOKIndicator.svelte';

  let mobileOpen = false;

  const links = [
    { href: '/learn', label: 'Learn' },
    { href: '/bpmn', label: 'BPMN' },
    { href: '/simulator', label: 'Simulator' },
    { href: '/personas', label: 'Personas' },
    { href: '/settings', label: 'Settings' }
  ];

  function navTo(href) {
    navigate(href);
    mobileOpen = false;
  }

  $: currentPath = typeof window !== 'undefined' ? getPath() : '/';
</script>

<nav class="nav" aria-label="Main navigation">
  <div class="nav__inner">
    <button class="nav__brand" on:click={() => navTo('/')}>
      <span class="nav__logo">AF</span>
      <span class="nav__wordmark">AgileFocus</span>
    </button>

    <div class="nav__links" class:nav__links--open={mobileOpen}>
      {#each links as link (link.href)}
        <button
          class="nav__link"
          class:nav__link--active={currentPath.startsWith(link.href)}
          on:click={() => navTo(link.href)}
        >
          {link.label}
        </button>
      {/each}
    </div>

    <div class="nav__level">
      <BYOKIndicator />
      <Badge variant="level" text="Level {$progress.level}" />
    </div>

    <button class="nav__hamburger" on:click={() => mobileOpen = !mobileOpen} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen}>
      <span class="nav__hamburger-line"></span>
      <span class="nav__hamburger-line"></span>
      <span class="nav__hamburger-line"></span>
    </button>
  </div>

  {#if mobileOpen}
    <div class="nav__mobile" role="dialog" aria-label="Mobile navigation">
      {#each links as link (link.href)}
        <button
          class="nav__mobile-link"
          on:click={() => navTo(link.href)}
        >
          {link.label}
        </button>
      {/each}
    </div>
  {/if}
</nav>

<style>
  .nav {
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: var(--z-base);
  }

  .nav__inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-6);
    display: flex;
    align-items: center;
    height: 56px;
    gap: var(--space-8);
  }

  .nav__brand {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    text-decoration: none;
    color: var(--color-text-primary);
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    padding: 0;
  }

  .nav__logo {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: var(--text-sm);
    background: var(--color-accent-primary);
    color: var(--color-bg-primary);
    padding: 2px var(--space-2);
    border-radius: var(--radius-sm);
  }

  .nav__wordmark {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: var(--text-base);
  }

  .nav__links {
    display: flex;
    gap: var(--space-1);
    flex: 1;
  }

  .nav__link {
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    border-radius: var(--radius-sm);
    transition: color var(--transition-fast), background var(--transition-fast);
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
  }

  .nav__link:hover {
    color: var(--color-text-primary);
    background: var(--color-bg-surface);
  }

  .nav__link--active {
    color: var(--color-accent-primary);
  }

  .nav__level {
    flex-shrink: 0;
  }

  .nav__hamburger {
    display: none;
    flex-direction: column;
    gap: 4px;
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-2);
    border-radius: var(--radius-sm);
  }

  .nav__hamburger-line {
    display: block;
    width: 20px;
    height: 2px;
    background: var(--color-text-primary);
    border-radius: 1px;
    transition: transform var(--transition-fast);
  }

  .nav__mobile {
    display: none;
    position: absolute;
    top: 56px;
    left: 0;
    right: 0;
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
    padding: var(--space-2);
  }

  .nav__mobile-link {
    display: block;
    width: 100%;
    text-align: left;
    padding: var(--space-3) var(--space-4);
    color: var(--color-text-secondary);
    text-decoration: none;
    border-radius: var(--radius-sm);
    font-size: var(--text-base);
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
  }

  .nav__mobile-link:hover {
    background: var(--color-bg-surface);
    color: var(--color-text-primary);
  }

  @media (max-width: 768px) {
    .nav__links {
      display: none;
    }

    .nav__links--open {
      display: flex;
    }

    .nav__hamburger {
      display: flex;
    }

    .nav__mobile {
      display: block;
    }

    .nav__level {
      margin-left: auto;
    }
  }
</style>
