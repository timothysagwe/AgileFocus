<script>
  import { settings } from '../stores/settings.js';
  import { getDefaultClient } from '../engines/byok-client.js';

  export let featureName = '';

  $: isActive = $settings.byok_active;

  const client = getDefaultClient();
  $: byokAvailable = client.isAvailable();
  $: showAI = isActive && byokAvailable;
</script>

{#if showAI}
  <slot name="ai" />
{:else}
  <slot name="fallback" />
{/if}
