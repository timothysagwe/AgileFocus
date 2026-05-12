<script>
  import Badge from './Badge.svelte';

  export let persona = null;
  export let trustScore = 50;

  $: trustCategory = trustScore > 70 ? 'allied' : trustScore >= 40 ? 'neutral' : 'hostile';
  $: orgTypeLabel = orgTypeLabels[persona?.organisation_type] || persona?.organisation_type || '';
  $: styleLabel = styleLabels[persona?.communication_style] || persona?.communication_style || '';

  const orgTypeLabels = {
    tier1_bank: 'Tier 1 Bank',
    challenger_bank: 'Challenger Bank',
    regulator: 'Regulator',
    central_government: 'Central Gov',
    local_government: 'Local Gov',
    nhs: 'NHS',
    consultancy: 'Consultancy'
  };

  const styleLabels = {
    formal_data_driven: 'Formal/Data',
    politically_cautious: 'Cautious',
    technically_aggressive: 'Technical',
    relationship_first: 'Relationship',
    deadline_obsessed: 'Deadline',
    audit_minded: 'Audit'
  };
</script>

<div class="p-card">
  <div class="p-card__trust" class:p-card__trust--allied={trustCategory === 'allied'} class:p-card__trust--neutral={trustCategory === 'neutral'} class:p-card__trust--hostile={trustCategory === 'hostile'}>
    {trustScore}
  </div>
  <div class="p-card__body">
    <h3 class="p-card__name">{persona?.name || 'Unknown'}</h3>
    <p class="p-card__role">{persona?.role || ''}</p>
    <div class="p-card__tags">
      <Badge variant="info" text={orgTypeLabel} />
      <Badge variant="level" text={styleLabel} />
    </div>
    {#if persona?.agenda}
      <p class="p-card__agenda">{persona.agenda.slice(0, 50)}{persona.agenda.length > 50 ? '...' : ''}</p>
    {/if}
  </div>
</div>

<style>
  .p-card {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    transition: border-color var(--transition-fast);
  }

  .p-card__trust {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: var(--text-sm);
    flex-shrink: 0;
    border: 2px solid;
  }
  .p-card__trust--allied { border-color: var(--color-accent-success); color: var(--color-accent-success); }
  .p-card__trust--neutral { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }
  .p-card__trust--hostile { border-color: var(--color-accent-danger); color: var(--color-accent-danger); }

  .p-card__body { flex: 1; display: flex; flex-direction: column; gap: var(--space-1); }
  .p-card__name { font-size: var(--text-base); font-weight: 600; }
  .p-card__role { font-size: var(--text-sm); color: var(--color-text-secondary); }
  .p-card__tags { display: flex; gap: var(--space-1); flex-wrap: wrap; margin-top: var(--space-1); }
  .p-card__agenda { font-size: var(--text-xs); color: var(--color-text-secondary); margin-top: var(--space-1); }
</style>
