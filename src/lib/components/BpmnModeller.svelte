<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import Modeler from 'bpmn-js/lib/Modeler';
  import 'bpmn-js/dist/assets/diagram-js.css';
  import 'bpmn-js/dist/assets/bpmn-js.css';

  export let initialXml = '';
  export let height = 600;
  export let exerciseId = '';

  const dispatch = createEventDispatcher();
  let container;
  let modeler;

  const STORAGE_PREFIX = 'bpmn_autosave_';

  onMount(() => {
    modeler = new Modeler({ container });
    loadInitial();

    modeler.on('commandStack.changed', () => {
      dispatch('change');
      autoSave();
    });
  });

  onDestroy(() => {
    if (modeler) modeler.destroy();
  });

  async function loadInitial() {
    if (!modeler) return;
    const saved = getAutoSave();
    const xml = saved || initialXml || getBlankDiagram();
    try {
      await modeler.importXML(xml);
      modeler.get('canvas').zoom('fit-viewport');
    } catch (err) {
      console.warn('[BpmnModeller] Failed to load XML, using blank:', err);
      try {
        await modeler.importXML(getBlankDiagram());
        modeler.get('canvas').zoom('fit-viewport');
      } catch {}
    }
  }

  export async function getXml() {
    if (!modeler) return '';
    try {
      const { xml } = await modeler.saveXML({ format: true });
      return xml;
    } catch {
      return '';
    }
  }

  export async function resetDiagram() {
    if (!modeler) return;
    clearAutoSave();
    try {
      await modeler.importXML(initialXml || getBlankDiagram());
      modeler.get('canvas').zoom('fit-viewport');
    } catch {}
  }

  function getAutoSave() {
    if (!exerciseId) return null;
    try {
      return localStorage.getItem(STORAGE_PREFIX + exerciseId);
    } catch { return null; }
  }

  function autoSave() {
    if (!exerciseId) return;
    modeler.saveXML({ format: true }).then(({ xml }) => {
      try {
        localStorage.setItem(STORAGE_PREFIX + exerciseId, xml);
      } catch {}
    }).catch(() => {});
  }

  function clearAutoSave() {
    if (!exerciseId) return;
    try {
      localStorage.removeItem(STORAGE_PREFIX + exerciseId);
    } catch {}
  }

  function getBlankDiagram() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_1" name="Pool" />
    </bpmn:laneSet>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="Lane_1_di" bpmnElement="Lane_1" isHorizontal="true">
        <dc:Bounds x="150" y="50" width="900" height="300" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
  }
</script>

<div class="bpmn-modeller" style="height: {height}px" bind:this={container} role="application" aria-label="BPMN diagram modeller"></div>

<style>
  .bpmn-modeller {
    width: 100%;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
    position: relative;
  }
  .bpmn-modeller :global(.bjs-powered-by) { display: none !important; }
  .bpmn-modeller :global(.djs-palette) { background: var(--color-bg-surface); border-color: var(--color-border); }
  .bpmn-modeller :global(.djs-palette .entry) { color: var(--color-text-secondary); }
  .bpmn-modeller :global(.djs-palette .entry:hover) { color: var(--color-accent-primary); background: var(--color-bg-secondary); }
  .bpmn-modeller :global(.djs-palette .group) { border-color: var(--color-border); }
  .bpmn-modeller :global(.djs-palette-header) { display: none; }
  .bpmn-modeller :global(.djs-context-pad) { background: var(--color-bg-surface); border-color: var(--color-border); }
  .bpmn-modeller :global(.djs-context-pad .entry) { color: var(--color-text-secondary); }
  .bpmn-modeller :global(.djs-popup) { background: var(--color-bg-surface); border-color: var(--color-border); color: var(--color-text-primary); }
  .bpmn-modeller :global(.djs-popup .entry) { color: var(--color-text-secondary); }
  .bpmn-modeller :global(.djs-popup .entry:hover) { background: var(--color-bg-secondary); color: var(--color-text-primary); }
  .bpmn-modeller :global(.djs-popup-header) { color: var(--color-text-primary); }
  .bpmn-modeller :global(.djs-select-entries) { color: var(--color-text-secondary); }
  .bpmn-modeller :global(.djs-popup-body .djs-popup-entry) { border-color: var(--color-border); }
  .bpmn-modeller :global(.djs-popup .djs-popup-entry.selected) { background: var(--color-bg-secondary); }
  .bpmn-modeller :global(.djs-label) { color: var(--color-text-secondary); fill: var(--color-text-secondary); }
  .bpmn-modeller :global(.djs-shape .djs-visual > :nth-child(1)) { fill: var(--color-bg-surface); stroke: var(--color-text-secondary); }
  .bpmn-modeller :global(.djs-connection .djs-visual > :nth-child(1)) { stroke: var(--color-text-secondary); }
  .bpmn-modeller :global(.djs-dragging .djs-visual) { opacity: 0.7; }
  .bpmn-modeller :global(.djs-bendpoint) { background: var(--color-accent-secondary); }
  .bpmn-modeller :global(.djs-hit) { stroke: transparent; }
</style>
