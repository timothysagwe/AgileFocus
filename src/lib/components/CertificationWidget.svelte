<script>
  import { progress } from '../stores/progress.js';
  import { navigate } from '../router.js';
  import Card from './Card.svelte';
  import ProgressBar from './ProgressBar.svelte';
  import Badge from './Badge.svelte';
  import { calculateAllCertifications } from '../engines/coverage-calculator.js';
  import psm1 from '../../data/certifications/psm1.json';
  import pmiacp from '../../data/certifications/pmi-acp.json';
  import agilepm from '../../data/certifications/agilepmdm.json';
  import bcsba from '../../data/certifications/bcs-ba.json';
  import gds from '../../data/certifications/gds-standard.json';

  const certMaps = [psm1, pmiacp, agilepm, bcsba, gds];

  $: coverageResults = $progress ? calculateAllCertifications($progress, certMaps) : {};
  $: resultsList = certMaps.map(c => ({
    id: c.id,
    title: c.title,
    result: coverageResults[c.id]
  }));
</script>

<div class="cert-widget">
  <div class="cert-widget__header">
    <h2 class="cert-widget__title">Certification Coverage</h2>
    <button class="cert-widget__link" on:click={() => navigate('/learn/certifications')}>View Full Dashboard</button>
  </div>
  <div class="cert-widget__list">
    {#each resultsList as cert (cert.id)}
      <div class="cert-widget__item">
        <div class="cert-widget__item-header">
          <span class="cert-widget__item-name">{cert.title}</span>
          <span class="cert-widget__item-pct" class:pct--high={cert.result && cert.result.overall_percentage >= 70} class:pct--mid={cert.result && cert.result.overall_percentage >= 40 && cert.result.overall_percentage < 70} class:pct--low={cert.result && cert.result.overall_percentage < 40}>
            {cert.result ? `${cert.result.overall_percentage}%` : '0%'}
          </span>
        </div>
        {#if cert.result}
          <div class="cert-widget__bar">
            <div class="cert-widget__bar-fill" style="width: {cert.result.overall_percentage}%;"></div>
          </div>
        {:else}
          <div class="cert-widget__bar">
            <div class="cert-widget__bar-fill" style="width: 0%;"></div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .cert-widget {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .cert-widget__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .cert-widget__title {
    font-size: var(--text-lg);
  }

  .cert-widget__link {
    background: none;
    border: none;
    color: var(--color-accent-primary);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: var(--text-sm);
    padding: 0;
  }

  .cert-widget__link:hover {
    text-decoration: underline;
  }

  .cert-widget__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .cert-widget__item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .cert-widget__item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .cert-widget__item-name {
    font-size: var(--text-sm);
  }

  .cert-widget__item-pct {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .pct--high { color: var(--color-accent-success); }
  .pct--mid { color: var(--color-accent-warning); }
  .pct--low { color: var(--color-text-secondary); }

  .cert-widget__bar {
    height: 6px;
    background: var(--color-bg-primary);
    border-radius: 3px;
    overflow: hidden;
  }

  .cert-widget__bar-fill {
    height: 100%;
    background: var(--color-accent-primary);
    border-radius: 3px;
    transition: width 0.4s ease;
  }
</style>
