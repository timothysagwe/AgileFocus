<script>
  import Badge from './Badge.svelte';
  import Button from './Button.svelte';
  import ProgressBar from './ProgressBar.svelte';

  export let result = null;
  export let visible = false;

  $: showHint = result && result.percentage < 50 && result.model_answer_hint;

  let activeSections = {};
  function toggleSection(key) {
    activeSections[key] = !activeSections[key];
  }
</script>

<div class="eval-panel" class:eval-panel--open={visible} role="region" aria-label="Evaluation results" aria-hidden={!visible}>
  <div class="eval-panel__inner">
    {#if result}
      <div class="eval-panel__header">
        <div class="eval-panel__score">
          <span class="eval-panel__pct">{result.percentage}%</span>
          <Badge variant={result.passed ? 'success' : 'danger'} text={result.passed ? 'Passed' : 'Failed'} />
        </div>
        <span class="eval-panel__fraction">{result.score} / {result.detailed_feedback.length || '?'} pts</span>
      </div>

      <ProgressBar value={result.percentage} label="Score" variant={result.passed ? 'default' : 'regulatory'} />

      <div class="eval-panel__checks">
        {#if result.element_checks && result.element_checks.length > 0}
          <button class="eval-panel__section-toggle" on:click={() => toggleSection('elements')}>
            <span>Element Checks ({result.element_checks.filter(c => c.points_earned > 0).length}/{result.element_checks.length})</span>
            <span class="eval-panel__arrow" class:eval-panel__arrow--open={activeSections.elements}>&#x25B6;</span>
          </button>
          {#if activeSections.elements}
            <div class="eval-panel__items">
              {#each result.element_checks as check}
                <div class="eval-panel__item" class:eval-panel__item--pass={check.points_earned > 0}>
                  <span class="eval-panel__item-icon">{check.points_earned > 0 ? '\u2714' : '\u2718'}</span>
                  <div class="eval-panel__item-body">
                    <span class="eval-panel__item-label">{check.feedback}</span>
                    {#if check.points_earned > 0}
                      <span class="eval-panel__item-pts">+{check.points_earned} pts</span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {/if}

        {#if result.pattern_checks && result.pattern_checks.length > 0}
          <button class="eval-panel__section-toggle" on:click={() => toggleSection('patterns')}>
            <span>Pattern Checks ({result.pattern_checks.filter(c => c.passed).length}/{result.pattern_checks.length})</span>
            <span class="eval-panel__arrow" class:eval-panel__arrow--open={activeSections.patterns}>&#x25B6;</span>
          </button>
          {#if activeSections.patterns}
            <div class="eval-panel__items">
              {#each result.pattern_checks as check}
                <div class="eval-panel__item" class:eval-panel__item--pass={check.passed}>
                  <span class="eval-panel__item-icon">{check.passed ? '\u2714' : '\u2718'}</span>
                  <div class="eval-panel__item-body">
                    <span class="eval-panel__item-label">{check.feedback}</span>
                    {#if check.points_earned > 0}
                      <span class="eval-panel__item-pts">+{check.points_earned} pts</span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {/if}

        {#if result.antipattern_checks && result.antipattern_checks.length > 0}
          <button class="eval-panel__section-toggle" on:click={() => toggleSection('antipatterns')}>
            <span>Antipatterns ({result.antipattern_checks.filter(c => !c.found).length}/{result.antipattern_checks.length})</span>
            <span class="eval-panel__arrow" class:eval-panel__arrow--open={activeSections.antipatterns}>&#x25B6;</span>
          </button>
          {#if activeSections.antipatterns}
            <div class="eval-panel__items">
              {#each result.antipattern_checks as check}
                <div class="eval-panel__item" class:eval-panel__item--warn={check.found}>
                  <span class="eval-panel__item-icon">{check.found ? '\u26A0' : '\u2714'}</span>
                  <div class="eval-panel__item-body">
                    <span class="eval-panel__item-label">{check.feedback}</span>
                    {#if check.found}
                      <span class="eval-panel__item-pts eval-panel__item-pts--penalty">-{check.penalty} pts</span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {/if}
      </div>

      {#if showHint}
        <div class="eval-panel__hint">
          <p class="eval-panel__hint-text">{result.model_answer_hint}</p>
        </div>
      {/if}
    {:else}
      <p class="eval-panel__empty">Run an evaluation to see results here.</p>
    {/if}
  </div>
</div>

<style>
  .eval-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: var(--z-overlay);
    transform: translateY(100%);
    transition: transform var(--transition-base);
  }
  .eval-panel--open {
    transform: translateY(0);
  }

  .eval-panel__inner {
    max-height: 60vh;
    overflow-y: auto;
    background: var(--color-bg-secondary);
    border-top: 2px solid var(--color-border);
    padding: var(--space-6);
    box-shadow: var(--shadow-lg);
    max-width: 1200px;
    margin: 0 auto;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .eval-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
  }

  .eval-panel__score {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .eval-panel__pct {
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-weight: 700;
  }

  .eval-panel__fraction {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .eval-panel__checks {
    margin-top: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .eval-panel__section-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-3) var(--space-4);
    cursor: pointer;
    font-family: var(--font-display);
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    transition: background var(--transition-fast);
  }
  .eval-panel__section-toggle:hover {
    background: var(--color-bg-primary);
  }

  .eval-panel__arrow {
    transition: transform var(--transition-fast);
    font-size: var(--text-xs);
  }
  .eval-panel__arrow--open {
    transform: rotate(90deg);
  }

  .eval-panel__items {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-2) 0 var(--space-2) var(--space-4);
  }

  .eval-panel__item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    border-left: 3px solid var(--color-accent-danger);
  }
  .eval-panel__item--pass {
    border-left-color: var(--color-accent-success);
  }
  .eval-panel__item--warn {
    border-left-color: var(--color-accent-warning);
  }

  .eval-panel__item-icon {
    flex-shrink: 0;
    font-size: var(--text-sm);
  }

  .eval-panel__item-body {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .eval-panel__item-label {
    color: var(--color-text-secondary);
  }

  .eval-panel__item-pts {
    font-family: var(--font-display);
    font-size: var(--text-xs);
    color: var(--color-accent-success);
    flex-shrink: 0;
  }
  .eval-panel__item-pts--penalty {
    color: var(--color-accent-danger);
  }

  .eval-panel__hint {
    margin-top: var(--space-4);
    padding: var(--space-4);
    background: rgba(240, 136, 62, 0.08);
    border: 1px solid rgba(240, 136, 62, 0.25);
    border-radius: var(--radius-md);
  }
  .eval-panel__hint-text {
    font-size: var(--text-sm);
    color: var(--color-accent-primary);
  }

  .eval-panel__empty {
    color: var(--color-text-secondary);
    text-align: center;
    padding: var(--space-8);
    font-size: var(--text-sm);
  }
</style>
