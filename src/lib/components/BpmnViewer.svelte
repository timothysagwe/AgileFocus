<script>
  import { onMount, onDestroy, afterUpdate, createEventDispatcher } from 'svelte';
  import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';

  export let xml = '';
  export let height = 500;

  const dispatch = createEventDispatcher();
  let container;
  let viewer;

  onMount(() => {
    viewer = new NavigatedViewer({ container });
    loadXml();
  });

  onDestroy(() => {
    if (viewer) viewer.destroy();
  });

  afterUpdate(() => {
    if (viewer) loadXml();
  });

  async function loadXml() {
    if (!viewer || !xml) return;
    try {
      const result = await viewer.importXML(xml);
      if (result.warnings) result.warnings.forEach(w => console.warn('[BpmnViewer]', w));
      viewer.get('canvas').zoom('fit-viewport');
      dispatch('loaded');
    } catch (err) {
      dispatch('error', { error: err.message || 'Failed to load diagram' });
    }
  }
</script>

<div class="bpmn-viewer" style="height: {height}px" bind:this={container} role="img" aria-label="BPMN diagram viewer"></div>

<style>
  .bpmn-viewer {
    width: 100%;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }
  .bpmn-viewer :global(.djs-palette) { display: none; }
  .bpmn-viewer :global(.djs-context-pad) { display: none; }
  .bpmn-viewer :global(.djs-popup) { display: none; }
  .bpmn-viewer :global(.bjs-powered-by) { display: none !important; }
</style>
