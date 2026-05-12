<script>
  import { settings } from '../../lib/stores/settings.js';
  import { progress } from '../../lib/stores/progress.js';
  import { BYOKClient } from '../../lib/engines/byok-client.js';
  import Card from '../../lib/components/Card.svelte';
  import Badge from '../../lib/components/Badge.svelte';
  import Alert from '../../lib/components/Alert.svelte';
  import Button from '../../lib/components/Button.svelte';

  const APP_VERSION = '0.1.0';

  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();

  let afterRemove = urlParams.get('afterRemove') === 'true';

  let apiKeyInput = '';
  let validationState = 'idle';
  let validationMessage = '';

  let client = new BYOKClient();

  let showRemoveConfirm = false;
  let showResetConfirm = false;
  let resetConfirmText = '';

  let showImportConfirm = false;
  let importFile = null;

  $: activeKey = $settings.byok_active;

  $: if ($settings.byok_key && !apiKeyInput) {
    apiKeyInput = $settings.byok_key;
    client.loadKey($settings.byok_key);
  }

  async function validateAndSave() {
    if (!apiKeyInput || !apiKeyInput.trim()) {
      validationState = 'error';
      validationMessage = 'Please enter an API key';
      return;
    }

    validationState = 'loading';
    validationMessage = 'Validating...';

    const result = await client.validateKey(apiKeyInput.trim());

    if (result.valid) {
      validationState = 'success';
      validationMessage = 'Key validated and saved successfully';
      client.loadKey(apiKeyInput.trim());
      settings.update(s => ({ ...s, byok_key: apiKeyInput.trim(), byok_active: true }));
    } else {
      validationState = 'error';
      validationMessage = result.error || 'Validation failed';
      settings.update(s => ({ ...s, byok_key: null, byok_active: false }));
    }
  }

  function confirmRemove() {
    showRemoveConfirm = true;
  }

  function removeKey() {
    client.clearKey();
    settings.update(s => ({ ...s, byok_key: null, byok_active: false }));
    apiKeyInput = '';
    validationState = 'idle';
    validationMessage = '';
    showRemoveConfirm = false;
  }

  function cancelRemove() {
    showRemoveConfirm = false;
  }

  function exportProgress() {
    const p = $progress;
    const data = JSON.stringify(p, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agilefocus-progress-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    importFile = file;
    showImportConfirm = true;
  }

  function confirmImport() {
    if (!importFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        progress.set(data);
        showImportConfirm = false;
        importFile = null;
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(importFile);
  }

  function cancelImport() {
    showImportConfirm = false;
    importFile = null;
  }

  function startReset() {
    showResetConfirm = true;
    resetConfirmText = '';
  }

  function confirmReset() {
    if (resetConfirmText !== 'RESET') return;
    progress.reset();
    showResetConfirm = false;
    resetConfirmText = '';
  }

  function cancelReset() {
    showResetConfirm = false;
    resetConfirmText = '';
  }

  const featureRows = [
    { feature: 'Persona Interactions', without: 'Pre-scripted responses from persona JSON files', with: 'Context-aware adaptive responses via AI, maintaining persona characteristics' },
    { feature: 'BPMN Feedback', without: 'Rubric-based scoring with pre-defined criteria', with: 'AI coaching feedback on model quality and compliance considerations' },
    { feature: 'Governance Coaching', without: 'Inline rubric feedback with pass/fail criteria', with: 'Personalised coaching feedback on exercise submissions' },
    { feature: 'Simulation Debrief', without: 'Final score with success criteria breakdown', with: 'Natural language debrief analysing decisions and suggesting improvements' },
    { feature: 'GDS Assessment', without: 'Built-in badge system and automated checks', with: 'Conversational assessment flow with AI-led questions' }
  ];
</script>

<div class="settings">
  <h1>Settings</h1>

  <section class="settings__section">
    <h2>API Key (BYOK)</h2>
    <Alert variant="info" title="Bring Your Own Key">
      <p>AgileFocus works fully without an API key. Adding your Anthropic API key unlocks enhanced AI features including adaptive stakeholder conversations and personalised coaching feedback. Your key is stored only in your browser and sent only to Anthropic's API. It is never transmitted to any other server or stored remotely.</p>
    </Alert>

    {#if afterRemove}
      <Alert variant="info">API key removed. All features will use the built-in logic layer.</Alert>
    {/if}

    {#if $settings.byok_active}
      <Alert variant="success">AI features are active. Your API key is configured.</Alert>
    {/if}

    <Card>
      <h3>Feature Comparison</h3>
      <div class="settings__table">
        <div class="settings__table-header">
          <span>Feature</span>
          <span>Without Key</span>
          <span>With Key</span>
        </div>
        {#each featureRows as row}
          <div class="settings__table-row">
            <span class="settings__feature-name">{row.feature}</span>
            <span class="settings__feature-desc">{row.without}</span>
            <span class="settings__feature-desc settings__feature-desc--ai">{row.with}</span>
          </div>
        {/each}
      </div>
    </Card>

    <Card>
      <div class="settings__key-section">
        <div class="settings__key-field">
          <label for="api-key">Anthropic API Key</label>
          <div class="settings__key-input-row">
            <input
              id="api-key"
              type="password"
              autocomplete="off"
              spellcheck="false"
              bind:value={apiKeyInput}
              placeholder="sk-ant-..."
            />
            <Button variant="primary" on:click={validateAndSave} loading={validationState === 'loading'}>
              {validationState === 'success' ? 'Saved' : validationState === 'loading' ? 'Validating...' : 'Validate & Save'}
            </Button>
            <Button variant="danger" on:click={confirmRemove}>Remove</Button>
          </div>
          {#if validationState === 'success'}
            <p class="settings__validation settings__validation--success">{validationMessage}</p>
          {:else if validationState === 'error'}
            <p class="settings__validation settings__validation--error">{validationMessage}</p>
          {:else if validationState === 'loading'}
            <p class="settings__validation settings__validation--loading">{validationMessage}</p>
          {/if}
        </div>

        <p class="settings__key-hint">
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer">Get an API key from Anthropic</a>
        </p>
      </div>
    </Card>
  </section>

  <section class="settings__section">
    <h2>Progress</h2>
    <Card>
      <div class="settings__progress-actions">
        <Button variant="secondary" on:click={exportProgress}>Export Progress</Button>

        <label class="settings__file-label">
          <span class="btn btn--secondary" style="display:inline-flex;padding:var(--space-2) var(--space-4);border-radius:var(--radius-md);cursor:pointer;">Import Progress</span>
          <input type="file" accept=".json" on:change={handleImportFile} style="display:none" />
        </label>

        <Button variant="ghost" on:click={startReset}>Reset All Progress</Button>
      </div>
    </Card>
  </section>

  <section class="settings__section">
    <h2>About</h2>
    <Card>
      <div class="settings__about">
        <div class="settings__about-row">
          <span>Version</span>
          <span class="settings__about-value">{APP_VERSION}</span>
        </div>
        <div class="settings__about-row">
          <span>Repository</span>
          <a href="https://github.com/timothysagwe/AgileFocus" target="_blank" rel="noopener noreferrer">github.com/timothysagwe/AgileFocus</a>
        </div>
        <div class="settings__about-row">
          <span>Attribution</span>
          <span class="settings__about-value">Built with bpmn-js and Chart.js (open source)</span>
        </div>
      </div>
    </Card>
  </section>
</div>

{#if showRemoveConfirm}
  <div class="settings__overlay" on:click={cancelRemove} role="presentation"></div>
  <div class="settings__confirm" role="dialog" aria-label="Confirm key removal">
    <p>Remove your API key? AI features will stop working and the app will use the built-in logic layer.</p>
    <div class="settings__confirm-actions">
      <Button variant="danger" on:click={removeKey}>Remove Key</Button>
      <Button variant="secondary" on:click={cancelRemove}>Cancel</Button>
    </div>
  </div>
{/if}

{#if showImportConfirm}
  <div class="settings__overlay" on:click={cancelImport} role="presentation"></div>
  <div class="settings__confirm" role="dialog" aria-label="Confirm progress import">
    <p>Import progress from file? This will <strong>replace</strong> your current progress with the data from the file.</p>
    <div class="settings__confirm-actions">
      <Button variant="danger" on:click={confirmImport}>Import & Replace</Button>
      <Button variant="secondary" on:click={cancelImport}>Cancel</Button>
    </div>
  </div>
{/if}

{#if showResetConfirm}
  <div class="settings__overlay" on:click={cancelReset} role="presentation"></div>
  <div class="settings__confirm" role="dialog" aria-label="Confirm progress reset">
    <p>This will permanently erase all progress. Type <strong>RESET</strong> to confirm.</p>
    <input type="text" bind:value={resetConfirmText} placeholder="Type RESET" autocomplete="off" />
    <div class="settings__confirm-actions">
      <Button variant="danger" on:click={confirmReset} disabled={resetConfirmText !== 'RESET'}>Reset All</Button>
      <Button variant="secondary" on:click={cancelReset}>Cancel</Button>
    </div>
  </div>
{/if}

<style>
  .settings { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-8); }
  .settings__section { display: flex; flex-direction: column; gap: var(--space-4); }
  .settings__section h2 { font-size: var(--text-xl); }

  .settings__table { display: flex; flex-direction: column; margin-top: var(--space-3); }
  .settings__table-header, .settings__table-row { display: grid; grid-template-columns: 180px 1fr 1fr; gap: var(--space-3); padding: var(--space-2) 0; font-size: var(--text-sm); align-items: start; }
  .settings__table-header { font-family: var(--font-display); font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.03em; color: var(--color-text-secondary); border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-2); }
  .settings__table-row { border-bottom: 1px solid var(--color-border); }
  .settings__feature-name { font-weight: 600; }
  .settings__feature-desc { color: var(--color-text-secondary); }
  .settings__feature-desc--ai { color: var(--color-accent-primary); }

  .settings__key-section { display: flex; flex-direction: column; gap: var(--space-4); }
  .settings__key-field label { font-size: var(--text-sm); font-weight: 600; display: block; margin-bottom: var(--space-2); }
  .settings__key-input-row { display: flex; gap: var(--space-2); align-items: center; }
  .settings__key-input-row input { flex: 1; padding: var(--space-2) var(--space-3); background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text-primary); font-family: var(--font-body); font-size: var(--text-sm); }
  .settings__key-input-row input:focus { outline: 2px solid var(--color-accent-secondary); outline-offset: -1px; }
  .settings__validation { font-size: var(--text-sm); margin-top: var(--space-1); }
  .settings__validation--success { color: var(--color-accent-success); }
  .settings__validation--error { color: var(--color-accent-danger); }
  .settings__validation--loading { color: var(--color-text-secondary); }
  .settings__key-hint { font-size: var(--text-sm); }
  .settings__key-hint a { color: var(--color-accent-secondary); }

  .settings__progress-actions { display: flex; gap: var(--space-3); align-items: center; flex-wrap: wrap; }

  .settings__about { display: flex; flex-direction: column; gap: var(--space-3); }
  .settings__about-row { display: flex; justify-content: space-between; align-items: center; font-size: var(--text-sm); }
  .settings__about-value { color: var(--color-text-secondary); }
  .settings__about-row a { color: var(--color-accent-secondary); }

  .settings__overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: var(--z-overlay); }
  .settings__confirm { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-6); z-index: var(--z-modal); display: flex; flex-direction: column; gap: var(--space-4); min-width: 360px; box-shadow: var(--shadow-lg); }
  .settings__confirm p { font-size: var(--text-sm); }
  .settings__confirm input { padding: var(--space-2) var(--space-3); background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text-primary); font-family: var(--font-body); font-size: var(--text-base); text-align: center; }
  .settings__confirm-actions { display: flex; gap: var(--space-3); justify-content: flex-end; }

  .settings__file-label .btn { font-family: var(--font-body); font-weight: 500; font-size: var(--text-sm); background: transparent; color: var(--color-text-primary); border: 1px solid var(--color-border); }
  .settings__file-label .btn:hover { background: var(--color-bg-surface); border-color: var(--color-text-secondary); }
</style>
