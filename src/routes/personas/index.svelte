<script>
  import { onMount } from 'svelte';
  import { navigate } from '../../lib/router.js';
  import { getPrebuiltPersonas, getCustomPersonas } from '../../lib/persona-data.js';
  import { progress } from '../../lib/stores/progress.js';
  import PersonaCard from '../../lib/components/PersonaCard.svelte';
  import Button from '../../lib/components/Button.svelte';
  import Badge from '../../lib/components/Badge.svelte';

  let prebuilt = [];
  let custom = [];
  let filterOrg = '';
  let filterStyle = '';
  let searchQuery = '';

  onMount(() => {
    prebuilt = getPrebuiltPersonas();
    custom = getCustomPersonas();
  });

  $: allPersonas = [...prebuilt, ...custom];
  $: createdIds = $progress.personas_created || [];

  $: filtered = allPersonas.filter(p => {
    if (filterOrg && p.organisation_type !== filterOrg) return false;
    if (filterStyle && p.communication_style !== filterStyle) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = (p.name || '').toLowerCase().includes(q);
      const matchesRole = (p.role || '').toLowerCase().includes(q);
      if (!matchesName && !matchesRole) return false;
    }
    return true;
  });

  function isPrebuilt(p) {
    return prebuilt.some(b => b.id === p.id);
  }

  function exportPersona(p) {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.id || 'persona'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="p-hub">
  <header class="p-hub__header">
    <h1>Personas</h1>
    <Button variant="primary" size="md" on:click={() => navigate('/personas/build')}>+ Create New Persona</Button>
  </header>

  <div class="p-hub__filters">
    <input type="text" placeholder="Search by name or role..." bind:value={searchQuery} class="p-hub__search" />
    <select bind:value={filterOrg} class="p-hub__select">
      <option value="">All organisations</option>
      <option value="tier1_bank">Tier 1 Bank</option>
      <option value="challenger_bank">Challenger Bank</option>
      <option value="regulator">Regulator</option>
      <option value="central_government">Central Government</option>
      <option value="local_government">Local Government</option>
      <option value="nhs">NHS</option>
      <option value="consultancy">Consultancy</option>
    </select>
    <select bind:value={filterStyle} class="p-hub__select">
      <option value="">All styles</option>
      <option value="formal_data_driven">Formal / Data-Driven</option>
      <option value="politically_cautious">Politically Cautious</option>
      <option value="technically_aggressive">Technically Aggressive</option>
      <option value="relationship_first">Relationship-First</option>
      <option value="deadline_obsessed">Deadline-Obsessed</option>
      <option value="audit_minded">Audit-Minded</option>
    </select>
  </div>

  {#if custom.length > 0}
    <section>
      <h2 class="p-hub__section-title">Your Personas ({custom.length})</h2>
      <div class="p-hub__grid">
        {#each custom as p (p.id)}
          <div class="p-hub__card-wrapper">
            <PersonaCard persona={p} trustScore={p.trust_score_initial || 50} />
            <div class="p-hub__card-actions">
              <Button variant="ghost" size="sm" on:click={() => exportPersona(p)}>Export</Button>
              <Button variant="secondary" size="sm" on:click={() => navigate('/personas/build?id=' + p.id)}>Edit</Button>
              {#if createdIds.includes(p.id)}
                <Badge variant="success" text="Saved" />
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <section>
    <h2 class="p-hub__section-title">Pre-built Personas ({filtered.length})</h2>
    <div class="p-hub__grid">
      {#each filtered as p (p.id)}
        <div class="p-hub__card-wrapper">
          <PersonaCard persona={p} trustScore={p.trust_score_initial || 50} />
          <div class="p-hub__card-actions">
            <Button variant="ghost" size="sm" on:click={() => exportPersona(p)}>Export</Button>
            {#if createdIds.includes(p.id)}
              <Badge variant="success" text="Used" />
            {/if}
          </div>
        </div>
      {/each}
    </div>
    {#if filtered.length === 0}
      <p class="p-hub__empty">No personas match your filters.</p>
    {/if}
  </section>
</div>

<style>
  .p-hub { display: flex; flex-direction: column; gap: var(--space-6); }
  .p-hub__header { display: flex; align-items: center; justify-content: space-between; }

  .p-hub__filters { display: flex; gap: var(--space-3); flex-wrap: wrap; }
  .p-hub__search { flex: 1; min-width: 200px; background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: var(--space-2) var(--space-3); color: var(--color-text-primary); font-size: var(--text-sm); font-family: var(--font-body); }
  .p-hub__select { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: var(--space-2) var(--space-3); color: var(--color-text-primary); font-size: var(--text-sm); font-family: var(--font-body); }

  .p-hub__section-title { font-size: var(--text-xl); margin-bottom: var(--space-3); }
  .p-hub__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-3); }
  .p-hub__card-wrapper { display: flex; flex-direction: column; gap: var(--space-2); }
  .p-hub__card-actions { display: flex; gap: var(--space-1); align-items: center; }
  .p-hub__empty { color: var(--color-text-secondary); font-size: var(--text-sm); padding: var(--space-8); text-align: center; }
</style>
