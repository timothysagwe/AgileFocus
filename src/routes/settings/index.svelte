<script>
  import { navigate } from '../../lib/router.js';
  import { sim } from '../../lib/stores/state.js';
  import Button from '../../lib/components/Button.svelte';

  let byokKey = '';
  let saved = false;

  function saveKey() {
    try {
      localStorage.setItem('af2_byok_key', byokKey);
      saved = true;
      setTimeout(() => saved = false, 2000);
    } catch {}
  }

  function clearData() {
    if (confirm('Clear all simulation data and reset?')) {
      sim.reset();
      localStorage.removeItem('af2_state');
      localStorage.removeItem('af2_byok_key');
    }
  }
</script>

<div class="settings">
  <h1 class="settings__title">Settings</h1>

  <div class="settings__section">
    <h2>Bring Your Own Key (BYOK)</h2>
    <p class="settings__desc">Optionally provide an Anthropic API key to enhance persona responses and feedback with AI. The app works fully without this.</p>
    <div class="settings__field">
      <input
        class="settings__input"
        type="password"
        bind:value={byokKey}
        placeholder="sk-ant-..."
      />
      <Button variant="primary" on:click={saveKey}>
        {saved ? 'Saved' : 'Save Key'}
      </Button>
    </div>
  </div>

  <div class="settings__section">
    <h2>Data</h2>
    <p class="settings__desc">All data is stored locally in your browser. No data is sent to any server.</p>
    <Button variant="danger" on:click={clearData}>Clear All Data & Reset</Button>
  </div>

  <div class="settings__section">
    <h2>About</h2>
    <p class="settings__desc">AgileFocus V2 — Workday Simulator for PMs and BAs in regulated environments. Built with Svelte 4. No backend. No tracking. MIT License.</p>
  </div>
</div>

<style>
  .settings { padding: var(--space-8) var(--space-6); max-width: 600px; margin: 0 auto; }
  .settings__title { font-family: var(--font-display); font-size: var(--text-3xl); font-weight: 700; margin-bottom: var(--space-8); }
  .settings__section { margin-bottom: var(--space-8); padding: var(--space-5); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-bg-surface); }
  .settings__section h2 { font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-2); }
  .settings__desc { font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-4); line-height: 1.6; }
  .settings__field { display: flex; gap: var(--space-3); }
  .settings__input { flex: 1; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: var(--space-2) var(--space-3); color: var(--color-text); font-family: var(--font-body); font-size: var(--text-sm); }
  .settings__input:focus { outline: none; border-color: var(--color-accent); }
</style>
