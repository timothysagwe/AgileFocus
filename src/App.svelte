<script>
  import { onMount, onDestroy } from 'svelte';
  import './styles/global.css';
  import { onPathChange } from './lib/router.js';
  import Navigation from './lib/components/Navigation.svelte';
  import Index from './routes/index.svelte';
  import Learn from './routes/learn/index.svelte';
  import BpmnHub from './routes/bpmn/index.svelte';
  import BpmnExercise from './routes/bpmn/exercise.svelte';
  import Simulator from './routes/simulator/index.svelte';
  import Simulation from './routes/simulator/Simulation.svelte';
  import Personas from './routes/personas/index.svelte';
  import PersonasBuild from './routes/personas/build.svelte';
  import Settings from './routes/settings/index.svelte';
  import GovernanceHub from './routes/learn/governance/index.svelte';
  import Topic1 from './routes/learn/governance/topic-1.svelte';
  import Topic2 from './routes/learn/governance/topic-2.svelte';
  import Topic3 from './routes/learn/governance/topic-3.svelte';
  import Topic4 from './routes/learn/governance/topic-4.svelte';
  import Topic5 from './routes/learn/governance/topic-5.svelte';
  import Topic6 from './routes/learn/governance/topic-6.svelte';
  import Certs from './routes/learn/certifications.svelte';
  import CertQuiz from './routes/learn/quiz/cert-quiz.svelte';

  let page = 'index';
  let exerciseId = '';
  let simulationId = '';
  let govTopic = '';
  let certId = '';

  const routeMap = [
    { pattern: /^\/$/, name: 'index' },
    { pattern: /^\/learn$/, name: 'learn' },
    { pattern: /^\/bpmn$/, name: 'bpmn' },
    { pattern: /^\/bpmn\/(.+)$/, name: 'bpmn-exercise' },
    { pattern: /^\/simulator$/, name: 'simulator' },
    { pattern: /^\/simulator\/(.+)$/, name: 'simulation-detail' },
    { pattern: /^\/personas\/build$/, name: 'personas-build' },
    { pattern: /^\/personas$/, name: 'personas' },
    { pattern: /^\/settings$/, name: 'settings' },
    { pattern: /^\/learn\/governance\/topic-(\d+)$/, name: 'governance-topic' },
    { pattern: /^\/learn\/governance$/, name: 'governance-hub' },
    { pattern: /^\/learn\/certifications$/, name: 'certifications' },
    { pattern: /^\/learn\/quiz\/(.+)$/, name: 'cert-quiz' }
  ];

  function resolveRoute(pathname) {
    for (const route of routeMap) {
      const match = pathname.match(route.pattern);
      if (match) {
        if (route.name === 'bpmn-exercise') {
          exerciseId = match[1];
        }
        if (route.name === 'simulation-detail') {
          simulationId = match[1];
        }
        if (route.name === 'governance-topic') {
          govTopic = 'topic-' + match[1];
        }
        if (route.name === 'cert-quiz') {
          certId = match[1];
        }
        return route.name;
      }
    }
    return 'index';
  }

  let unsub;
  onMount(() => {
    page = resolveRoute(window.location.pathname);
    unsub = onPathChange((path) => {
      page = resolveRoute(path);
    });
  });

  onDestroy(() => {
    if (unsub) unsub();
  });
</script>

<Navigation />
<main>
  {#if page === 'index'}
    <Index />
  {:else if page === 'learn'}
    <Learn />
  {:else if page === 'bpmn'}
    <BpmnHub />
  {:else if page === 'bpmn-exercise'}
    <BpmnExercise exerciseId={exerciseId} />
  {:else if page === 'simulator'}
    <Simulator />
  {:else if page === 'simulation-detail'}
    <Simulation scenarioId={simulationId} />
  {:else if page === 'personas'}
    <Personas />
  {:else if page === 'personas-build'}
    <PersonasBuild />
  {:else if page === 'governance-hub'}
    <GovernanceHub />
  {:else if page === 'governance-topic'}
    {#if govTopic === 'topic-1'}
      <Topic1 />
    {:else if govTopic === 'topic-2'}
      <Topic2 />
    {:else if govTopic === 'topic-3'}
      <Topic3 />
    {:else if govTopic === 'topic-4'}
      <Topic4 />
    {:else if govTopic === 'topic-5'}
      <Topic5 />
    {:else if govTopic === 'topic-6'}
      <Topic6 />
    {/if}
  {:else if page === 'certifications'}
    <Certs />
  {:else if page === 'cert-quiz'}
    <CertQuiz certId={certId} />
  {:else if page === 'settings'}
    <Settings />
  {:else}
    <Index />
  {/if}
</main>

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-8) var(--space-6);
  }
</style>
