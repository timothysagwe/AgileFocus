<script>
  import { onMount, onDestroy } from 'svelte';
  import { getPath, onPathChange } from './lib/router.js';
  import NavBar from './lib/components/NavBar.svelte';
  import Index from './routes/index.svelte';
  import Simulator from './routes/simulator/index.svelte';
  import Simulation from './routes/simulator/[id].svelte';
  import Settings from './routes/settings/index.svelte';

  let page = 'index';
  let simId = '';

  const routes = [
    { pattern: /^\/$/, name: 'index' },
    { pattern: /^\/simulator$/, name: 'simulator' },
    { pattern: /^\/simulator\/(.+)$/, name: 'sim-detail' },
    { pattern: /^\/settings$/, name: 'settings' }
  ];

  function resolve(path) {
    for (const r of routes) {
      const m = path.match(r.pattern);
      if (m) {
        if (r.name === 'sim-detail') simId = m[1];
        return r.name;
      }
    }
    return 'index';
  }

  let unsub;
  onMount(() => {
    page = resolve(getPath());
    unsub = onPathChange(p => page = resolve(p));
  });
  onDestroy(() => { if (unsub) unsub(); });
</script>

<NavBar />
<main>
  {#if page === 'index'}
    <Index />
  {:else if page === 'simulator'}
    <Simulator />
  {:else if page === 'sim-detail'}
    <Simulation scenarioId={simId} />
  {:else if page === 'settings'}
    <Settings />
  {:else}
    <Index />
  {/if}
</main>

<style>
  main {
    height: calc(100% - 48px);
  }
</style>
