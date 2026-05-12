<script>
  import { onMount } from 'svelte';
  import { navigate } from '../../lib/router.js';
  import { saveCustomPersona, getCustomPersonas, generatePersonaId, getPrebuiltPersona } from '../../lib/persona-data.js';
  import { progress } from '../../lib/stores/progress.js';
  import { settings } from '../../lib/stores/settings.js';
  import Card from '../../lib/components/Card.svelte';
  import Button from '../../lib/components/Button.svelte';
  import Badge from '../../lib/components/Badge.svelte';
  import Modal from '../../lib/components/Modal.svelte';
  import PersonaCard from '../../lib/components/PersonaCard.svelte';
  import PersonaChat from '../../lib/components/PersonaChat.svelte';

  let currentStep = 1;
  let testModalOpen = false;

  let persona = {
    id: '',
    name: '',
    role: '',
    organisation_type: '',
    communication_style: '',
    agenda: '',
    knowledge_boundary: { misunderstands: '', triggers_on: '' },
    trust_score_initial: 50,
    triggers: [],
    conflict_with: [],
    responses: {},
    byok_system_prompt: ''
  };

  const commonContexts = [
    'sprint_review_positive', 'sprint_review_negative', 'budget_escalation',
    'regulatory_query', 'scope_change_request', 'audit_request',
    'milestone_achieved', 'blocker_raised'
  ];

  const conditionVars = [
    { value: 'budget_variance', label: 'Budget Variance (%)', type: 'number' },
    { value: 'sprint_velocity_trend', label: 'Sprint Velocity Trend', type: 'enum', options: ['improving', 'stable', 'declining'] },
    { value: 'regulatory_pressure', label: 'Regulatory Pressure', type: 'enum', options: ['low', 'elevated', 'critical'] },
    { value: 'days_to_governance_milestone', label: 'Days to Governance Milestone', type: 'number' },
    { value: 'sprint_number', label: 'Sprint Number', type: 'number' },
    { value: 'active_blockers.length', label: 'Active Blockers Count', type: 'number' },
    { value: 'evidence_pack_status', label: 'Evidence Pack Status', type: 'enum', options: ['none', 'draft', 'complete'] },
    { value: 'change_freeze_active', label: 'Change Freeze Active', type: 'enum', options: ['true', 'false'] },
    { value: 'backlog_size', label: 'Backlog Size', type: 'number' },
    { value: 'team_capacity_percentage', label: 'Team Capacity (%)', type: 'number' }
  ];

  const operators = ['>', '<', '>=', '<=', '==', '!='];

  const styleOptions = [
    { value: 'formal_data_driven', label: 'Formal & Data-Driven', desc: 'Requires written evidence, references data points' },
    { value: 'politically_cautious', label: 'Politically Cautious', desc: 'Avoids direct conflict, manages upwards, measures words' },
    { value: 'technically_aggressive', label: 'Technically Aggressive', desc: 'Challenges everything, wants technical depth, impatient with process' },
    { value: 'relationship_first', label: 'Relationship-First', desc: 'Prioritises trust and relationships over data, values personal rapport' },
    { value: 'deadline_obsessed', label: 'Deadline-Obsessed', desc: 'Shipping is the only metric, pushes for speed over process' },
    { value: 'audit_minded', label: 'Audit-Minded', desc: 'Defensible decisions only, everything in writing, risk-averse' }
  ];

  const orgTypeOptions = [
    ['tier1_bank', 'Tier 1 Bank'],
    ['challenger_bank', 'Challenger Bank'],
    ['regulator', 'Regulator'],
    ['central_government', 'Central Gov'],
    ['local_government', 'Local Gov'],
    ['nhs', 'NHS'],
    ['consultancy', 'Consultancy']
  ];

  const conflictOptions = [
    { label: 'Risk Manager', id: 'risk-manager-tier1' },
    { label: 'Product Owner', id: 'product-owner-challenger' },
    { label: 'Internal Auditor', id: 'internal-auditor' },
    { label: 'FCA Supervisor', id: 'fca-supervision' },
    { label: 'Government SRO', id: 'government-sro' },
    { label: 'GDS Assessor', id: 'gds-assessor' },
    { label: 'Tech Risk Director', id: 'tech-risk-director' },
    { label: 'Delivery Manager (NHS)', id: 'delivery-manager-nhs' }
  ];

  let editId = '';

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    editId = params.get('id') || '';
    if (editId) {
      const custom = getCustomPersonas();
      const found = custom.find(p => p.id === editId);
      if (found) persona = JSON.parse(JSON.stringify(found));
    }
  });

  function canProceed() {
    switch (currentStep) {
      case 1: return persona.name.trim() && persona.role.trim() && persona.organisation_type;
      case 2: return persona.agenda.trim() && persona.communication_style;
      case 3: return true;
      case 4: return persona.triggers.length > 0;
      case 5: return true;
      case 6: return Object.keys(persona.responses).some(k => persona.responses[k].trim());
      case 7: return true;
      case 8: return true;
      default: return false;
    }
  }

  function nextStep() { if (currentStep < 8 && canProceed()) currentStep++; }
  function prevStep() { if (currentStep > 1) currentStep--; }
  function goStep(n) { if (n < currentStep || canProceed()) currentStep = n; }

  function addTrigger() {
    persona.triggers = [...persona.triggers, {
      condition: '',
      response_key: '',
      trust_delta: -5,
      cascade_state_change: null,
      _selectedVar: '',
      _selectedOp: '>',
      _selectedVal: '',
      _useCascade: false,
      _cascadeVar: '',
      _cascadeVal: ''
    }];
  }

  function removeTrigger(i) {
    persona.triggers = persona.triggers.filter((_, idx) => idx !== i);
  }

  function buildTriggerCondition(t) {
    if (t._selectedVar && t._selectedOp && t._selectedVal) {
      return `${t._selectedVar} ${t._selectedOp} ${t._selectedVal}`;
    }
    return '';
  }

  function updateTriggerCondition(i) {
    const t = persona.triggers[i];
    t.condition = buildTriggerCondition(t);
    if (!t.response_key) {
      t.response_key = t._selectedVar ? `trigger_${t._selectedVar}` : `trigger_${i}`;
    }
    persona.triggers = persona.triggers;
  }

  function getVarType(varValue) {
    const found = conditionVars.find(v => v.value === varValue);
    return found?.type || 'number';
  }

  function getVarEnumOptions(varValue) {
    const found = conditionVars.find(v => v.value === varValue);
    return found?.options || [];
  }

  function addResponse(ctx) {
    persona.responses[ctx] = persona.responses[ctx] || '';
    persona.responses = { ...persona.responses };
  }

  function generateSystemPrompt() {
    const conflicts = persona.conflict_with.length > 0 ? ` Conflicts with: ${persona.conflict_with.join(', ')}.` : '';
    persona.byok_system_prompt = `You are ${persona.name || '[name]'}, ${persona.role || '[role]'} at a ${persona.organisation_type || '[org]'} organisation. You are ${persona.communication_style?.replace(/_/g, ' ') || 'professional'} in communication style. Your agenda: ${persona.agenda || '[agenda]'}. You misunderstand: ${persona.knowledge_boundary?.misunderstands || 'N/A'}. You trigger on: ${persona.knowledge_boundary?.triggers_on || 'N/A'}.${conflicts} Keep responses under 3 sentences unless asked for detail.`;
    persona.byok_system_prompt = persona.byok_system_prompt;
  }

  function savePersona() {
    if (!persona.id) persona.id = generatePersonaId(persona.name);
    const all = saveCustomPersona(persona);
    progress.update(p => {
      if (p.personas_created.includes(persona.id)) return p;
      return { ...p, personas_created: [...p.personas_created, persona.id] };
    });
    navigate('/personas');
  }

  function exportPersona() {
    if (!persona.id) persona.id = generatePersonaId(persona.name);
    const blob = new Blob([JSON.stringify(persona, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${persona.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function validateCondition(c) {
    if (!c.trim()) return { valid: true };
    const pattern = /^[a-zA-Z_][a-zA-Z0-9_.]*\s*(>=|<=|!=|==|>|<)\s*.+$/;
    const hasAnd = c.includes(' AND ');
    if (hasAnd) {
      const parts = c.split(' AND ');
      return parts.every(p => validateCondition(p.trim()).valid) ? { valid: true } : { valid: false, msg: 'Invalid condition part in AND expression' };
    }
    if (!pattern.test(c.trim())) return { valid: false, msg: 'Format: variable operator value (e.g. budget_variance > 15)' };
    return { valid: true };
  }

  const stepTitles = ['Identity', 'Agenda & Style', 'Knowledge Boundary', 'Triggers', 'Conflicts', 'Responses', 'AI Prompt', 'Review & Save'];
</script>

<div class="builder">
  <header class="builder__header">
    <h1>{editId ? 'Edit Persona' : 'Create Persona'}</h1>
    <div class="builder__step-tracker">
      {#each stepTitles as title, i}
        <button class="builder__step-dot" class:builder__step-dot--active={currentStep >= i + 1} class:builder__step-dot--current={currentStep === i + 1} on:click={() => goStep(i + 1)} title={title}>
          {i + 1}
        </button>
      {/each}
      <span class="builder__step-name">{stepTitles[currentStep - 1]}</span>
    </div>
  </header>

  <div class="builder__layout">
    <div class="builder__form">
      <!-- STEP 1: Identity -->
      {#if currentStep === 1}
        <div class="step">
          <h2>Identity</h2>
          <label class="field">
            <span>Name *</span>
            <input type="text" bind:value={persona.name} maxlength="50" placeholder="e.g. Claire Harrington" />
          </label>
          <label class="field">
            <span>Role *</span>
            <input type="text" bind:value={persona.role} maxlength="100" placeholder="e.g. Risk Manager" list="role-suggestions" />
            <datalist id="role-suggestions">
              <option value="Risk Manager" /><option value="Product Owner" /><option value="Internal Auditor" />
              <option value="IT Director" /><option value="Delivery Manager" /><option value="SRO" />
              <option value="GDS Assessor" /><option value="Business Analyst" /><option value="Programme Manager" />
              <option value="Compliance Officer" />
            </datalist>
          </label>
          <label class="field">
            <span>Organisation Type *</span>
            <div class="field__radios">
              {#each orgTypeOptions as [val, label]}
                <label class="field__radio" class:field__radio--selected={persona.organisation_type === val}>
                  <input type="radio" bind:group={persona.organisation_type} value={val} />
                  <span>{label}</span>
                </label>
              {/each}
            </div>
          </label>
          <label class="field">
            <span>Initial Trust Score: {persona.trust_score_initial}</span>
            <input type="range" min="0" max="100" bind:value={persona.trust_score_initial} />
          </label>
        </div>
      {/if}

      <!-- STEP 2: Agenda & Style -->
      {#if currentStep === 2}
        <div class="step">
          <h2>Agenda & Communication Style</h2>
          <label class="field">
            <span>Agenda *</span>
            <textarea bind:value={persona.agenda} maxlength="200" rows="3" placeholder="What does this person need to consider this project a success?"></textarea>
            <small class="field__hint">What does this person need to consider this project a success? This should differ from the official project objective.</small>
          </label>
          <label class="field">
            <span>Communication Style *</span>
            <div class="field__style-grid">
                {#each styleOptions as { value: val, label, desc }}
                <label class="field__style-card" class:field__style-card--selected={persona.communication_style === val} on:click={() => persona.communication_style = val}>
                  <strong>{label}</strong>
                  <small>{desc}</small>
                </label>
              {/each}
            </div>
          </label>
        </div>
      {/if}

      <!-- STEP 3: Knowledge Boundary -->
      {#if currentStep === 3}
        <div class="step">
          <h2>Knowledge Boundary</h2>
          <p class="step__hint">Knowledge boundaries make personas realistic. A Risk Manager who thinks velocity = headcount creates genuine tension in sprint reviews.</p>
          <label class="field">
            <span>What does this persona misunderstand?</span>
            <textarea bind:value={persona.knowledge_boundary.misunderstands} maxlength="150" rows="2" placeholder="e.g. Sprint velocity trends — interprets declining velocity as team underperformance..."></textarea>
          </label>
          <label class="field">
            <span>What topic reveals this gap?</span>
            <input type="text" bind:value={persona.knowledge_boundary.triggers_on} maxlength="100" placeholder="e.g. 'we can fix it in a later sprint'" />
          </label>
          <details class="step__examples">
            <summary>Example Knowledge Boundaries</summary>
            <ul>
              <li><strong>Risk Manager:</strong> Thinks velocity = productivity. Triggers on "technical debt".</li>
              <li><strong>Product Owner:</strong> Thinks DoD means code compiles. Triggers on "process".</li>
              <li><strong>Government SRO:</strong> Thinks Agile means no plan. Triggers on "it depends on the sprint".</li>
              <li><strong>Internal Auditor:</strong> Asks for Gantt charts. Triggers on "we don't do documentation".</li>
            </ul>
          </details>
        </div>
      {/if}

      <!-- STEP 4: Triggers -->
      {#if currentStep === 4}
        <div class="step">
          <h2>Triggers</h2>
          <p class="step__hint">Define what events trigger this persona's responses and trust changes. Add up to 5 triggers.</p>
          {#each persona.triggers as trigger, i}
            <div class="step__trigger">
              <div class="step__trigger-header">
                <strong>Trigger {i + 1}</strong>
                <button class="step__remove" on:click={() => removeTrigger(i)} aria-label="Remove trigger">&times;</button>
              </div>
              <div class="step__trigger-builder">
                <select bind:value={trigger._selectedVar} on:change={() => updateTriggerCondition(i)}>
                  <option value="">Select variable...</option>
                  {#each conditionVars as v}
                    <option value={v.value}>{v.label}</option>
                  {/each}
                </select>
                <select bind:value={trigger._selectedOp} on:change={() => updateTriggerCondition(i)}>
                  {#each operators as op}
                    <option value={op}>{op}</option>
                  {/each}
                </select>
                {#if getVarType(trigger._selectedVar) === 'enum' && getVarEnumOptions(trigger._selectedVar).length > 0}
                  <select bind:value={trigger._selectedVal} on:change={() => updateTriggerCondition(i)}>
                    <option value="">Select value...</option>
                    {#each getVarEnumOptions(trigger._selectedVar) as opt}
                      <option value={opt}>{opt}</option>
                    {/each}
                  </select>
                {:else}
                  <input type="text" bind:value={trigger._selectedVal} on:input={() => updateTriggerCondition(i)} placeholder="Value" />
                {/if}
              </div>
              {#if trigger.condition}
                <div class="step__condition-preview">{trigger.condition}</div>
                {#each [validateCondition(trigger.condition)] as v}
                  {#if !v.valid}
                    <p class="step__error">{v.msg}</p>
                  {/if}
                {/each}
              {/if}
              <label class="field">
                <span>Response Key</span>
                <input type="text" bind:value={trigger.response_key} placeholder="e.g. budget_overrun" />
              </label>
              <label class="field">
                <span>Response Text *</span>
                <textarea value={trigger._responseText || ''} on:input={e => { persona.triggers[i] = { ...persona.triggers[i], _responseText: e.target.value }; }} maxlength="500" rows="2" placeholder="What will this persona say?"></textarea>
              </label>
              <label class="field">
                <span>Trust Delta: {trigger.trust_delta}</span>
                <input type="range" min="-30" max="30" bind:value={trigger.trust_delta} />
              </label>
              <label class="field__cascade">
                <input type="checkbox" bind:checked={trigger._useCascade} />
                <span>Trigger cascade state change</span>
              </label>
              {#if trigger._useCascade}
                <div class="step__trigger-builder">
                  <select bind:value={trigger._cascadeVar}>
                    <option value="">Select variable...</option>
                    {#each conditionVars as v}
                      <option value={v.value}>{v.label}</option>
                    {/each}
                  </select>
                  <input type="text" bind:value={trigger._cascadeVal} placeholder="New value" />
                </div>
              {/if}
              <div class="step__trigger-preview">
                <small>If <strong>{trigger.condition || '[condition]'}</strong>, {persona.name || '[name]'} will say: "{trigger._responseText || '[response]'}" and trust will {trigger.trust_delta >= 0 ? 'increase' : 'decrease'} by {Math.abs(trigger.trust_delta)} points.</small>
              </div>
            </div>
          {/each}
          {#if persona.triggers.length < 5}
            <Button variant="secondary" size="sm" on:click={addTrigger}>+ Add Trigger</Button>
          {/if}
          {#if persona.triggers.length === 0}
            <p class="step__warning">No triggers defined — this persona will be static and never react to state changes.</p>
          {/if}
        </div>
      {/if}

      <!-- STEP 5: Conflicts -->
      {#if currentStep === 5}
        <div class="step">
          <h2>Conflicts</h2>
          <p class="step__hint">Conflict doesn't mean hostility. It means their agendas create genuine tension that requires PM navigation.</p>
          <div class="field__checklist">
            {#each conflictOptions as { label, id }}
              <label class="field__checkbox">
                <input type="checkbox" value={id} checked={persona.conflict_with.includes(id)} on:change={e => {
                  if (e.target.checked) persona.conflict_with = [...persona.conflict_with, id];
                  else persona.conflict_with = persona.conflict_with.filter(c => c !== id);
                  persona.conflict_with = persona.conflict_with;
                }} />
                <span>{label}</span>
              </label>
            {/each}
          </div>
        </div>
      {/if}

      <!-- STEP 6: Responses -->
      {#if currentStep === 6}
        <div class="step">
          <h2>Response Library</h2>
          <p class="step__hint">Define responses for common scenarios beyond triggers.</p>
          {#each commonContexts as ctx}
            <details class="step__response-details">
              <summary on:click={() => addResponse(ctx)}>
                {ctx.replace(/_/g, ' ')} {persona.responses[ctx] ? '\u2714' : '\u2795'}
              </summary>
              {#if persona.responses[ctx] !== undefined}
                <textarea bind:value={persona.responses[ctx]} maxlength="500" rows="2" placeholder="Response text for this context..."></textarea>
              {/if}
            </details>
          {/each}
          {#if !Object.keys(persona.responses).some(k => persona.responses[k].trim())}
            <p class="step__warning">No responses defined — this persona will be silent in most situations.</p>
          {/if}
        </div>
      {/if}

      <!-- STEP 7: BYOK Prompt -->
      {#if currentStep === 7}
        <div class="step">
          <h2>AI System Prompt (Optional)</h2>
          <p class="step__hint">This prompt is sent to the AI to constrain its responses to this persona's character. It overrides pre-scripted responses when a BYOK key is active.</p>
          <label class="field">
            <span>System Prompt</span>
            <textarea bind:value={persona.byok_system_prompt} maxlength="1000" rows="6" placeholder="You are [name], [role] at [org]. You are [style]..."></textarea>
          </label>
          <Button variant="secondary" size="sm" on:click={generateSystemPrompt}>Generate from Persona Data</Button>
        </div>
      {/if}

      <!-- STEP 8: Review & Save -->
      {#if currentStep === 8}
        <div class="step">
          <h2>Review & Save</h2>
          <Card>
            <div class="step__review">
              <PersonaCard persona={persona} trustScore={persona.trust_score_initial || 50} />
              <div class="step__review-details">
                <p><strong>Agenda:</strong> {persona.agenda}</p>
                <p><strong>Knowledge Boundary:</strong> {persona.knowledge_boundary?.misunderstandss || persona.knowledge_boundary?.misunderstands || 'None'} — triggers on "{persona.knowledge_boundary?.triggers_on || 'N/A'}"</p>
                <p><strong>Triggers:</strong> {persona.triggers.length} defined</p>
                <p><strong>Conflicts:</strong> {persona.conflict_with.length > 0 ? persona.conflict_with.join(', ') : 'None'}</p>
                <p><strong>Responses:</strong> {Object.keys(persona.responses).filter(k => persona.responses[k]?.trim()).length} defined</p>
                <p><strong>AI Prompt:</strong> {persona.byok_system_prompt ? 'Configured' : 'Not configured'}</p>
              </div>
            </div>
          </Card>
          <div class="step__actions">
            <Button variant="secondary" size="md" on:click={() => testModalOpen = true}>Test Persona</Button>
            <Button variant="primary" size="md" on:click={savePersona}>Save to Library</Button>
            <Button variant="ghost" size="md" on:click={exportPersona}>Export as JSON</Button>
          </div>
        </div>
      {/if}

      <!-- Navigation -->
      <div class="builder__nav">
        <Button variant="ghost" size="sm" on:click={prevStep} disabled={currentStep === 1}>Back</Button>
        <span class="builder__nav-step">{currentStep} / 8</span>
        {#if currentStep < 8}
          <Button variant="primary" size="sm" on:click={nextStep} disabled={!canProceed()}>
            {canProceed() ? 'Next' : 'Fill required fields'}
          </Button>
        {:else}
          <Button variant="primary" size="sm" on:click={savePersona}>Save</Button>
        {/if}
      </div>
    </div>

    <!-- Preview Panel -->
    <aside class="builder__preview">
      <h3>Preview</h3>
      <PersonaCard persona={persona} trustScore={persona.trust_score_initial || 50} />
      <div class="builder__preview-details">
        {#if persona.triggers.length > 0}
          <h4>Triggers ({persona.triggers.length})</h4>
          <ul>
            {#each persona.triggers as t, i}
              <li>{t.condition || 'Unconfigured'}</li>
            {/each}
          </ul>
        {/if}
        {#if persona.conflict_with.length > 0}
          <h4>Conflicts ({persona.conflict_with.length})</h4>
          <ul>
            {#each persona.conflict_with as c}
              <li>{c}</li>
            {/each}
          </ul>
        {/if}
      </div>
    </aside>
  </div>
</div>

<Modal open={testModalOpen} title="Test Persona" size="lg">
  <PersonaChat persona={persona} projectState={{
    budget_variance: 5, sprint_velocity_trend: 'stable', regulatory_pressure: 'low',
    days_to_governance_milestone: 30, sprint_number: 1, active_blockers: [],
    evidence_pack_status: 'none', change_freeze_active: false, backlog_size: 20,
    team_capacity_percentage: 85
  }} />
  <svelte:fragment slot="footer">
    <Button variant="ghost" size="sm" on:click={() => testModalOpen = false}>Close</Button>
  </svelte:fragment>
</Modal>

<style>
  .builder { display: flex; flex-direction: column; gap: var(--space-6); }
  .builder__header { display: flex; flex-direction: column; gap: var(--space-3); }
  .builder__step-tracker { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); }
  .builder__step-dot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--color-border); background: transparent; color: var(--color-text-secondary); font-family: var(--font-display); font-size: var(--text-xs); cursor: pointer; transition: all var(--transition-fast); display: flex; align-items: center; justify-content: center; }
  .builder__step-dot--active { border-color: var(--color-accent-primary); background: var(--color-accent-primary); color: var(--color-bg-primary); }
  .builder__step-dot--current { border-color: var(--color-accent-secondary); box-shadow: 0 0 0 2px rgba(88,166,255,0.3); }
  .builder__step-name { color: var(--color-text-secondary); font-size: var(--text-sm); }

  .builder__layout { display: grid; grid-template-columns: 1fr 280px; gap: var(--space-6); align-items: start; }
  .builder__form { display: flex; flex-direction: column; gap: var(--space-6); }
  .builder__preview { position: sticky; top: 72px; display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-4); background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
  .builder__preview h3 { font-size: var(--text-base); }
  .builder__preview h4 { font-size: var(--text-sm); margin-top: var(--space-3); }
  .builder__preview ul { font-size: var(--text-xs); color: var(--color-text-secondary); padding-left: var(--space-4); }
  .builder__preview-details { font-size: var(--text-sm); color: var(--color-text-secondary); }

  .step { display: flex; flex-direction: column; gap: var(--space-4); }
  .step__hint { font-size: var(--text-sm); color: var(--color-text-secondary); }
  .step__examples { font-size: var(--text-sm); color: var(--color-text-secondary); }
  .step__examples summary { cursor: pointer; margin-bottom: var(--space-2); }
  .step__examples ul { padding-left: var(--space-4); display: flex; flex-direction: column; gap: var(--space-1); }
  .step__warning { color: var(--color-accent-warning); font-size: var(--text-sm); }
  .step__error { color: var(--color-accent-danger); font-size: var(--text-xs); }
  .step__trigger { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); }
  .step__trigger-header { display: flex; justify-content: space-between; align-items: center; }
  .step__remove { background: none; border: none; color: var(--color-accent-danger); cursor: pointer; font-size: var(--text-lg); }
  .step__trigger-builder { display: flex; gap: var(--space-2); }
  .step__trigger-builder select, .step__trigger-builder input { flex: 1; background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: var(--space-2); font-size: var(--text-sm); color: var(--color-text-primary); font-family: var(--font-body); }
  .step__condition-preview { font-family: var(--font-display); font-size: var(--text-xs); color: var(--color-accent-secondary); }
  .step__trigger-preview { font-size: var(--text-xs); color: var(--color-text-secondary); background: var(--color-bg-primary); padding: var(--space-2); border-radius: var(--radius-sm); }
  .step__response-details { font-size: var(--text-sm); }
  .step__response-details textarea { width: 100%; background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: var(--space-2); color: var(--color-text-primary); font-family: var(--font-body); font-size: var(--text-sm); margin-top: var(--space-2); }
  .step__review { display: flex; gap: var(--space-4); }
  .step__review-details { flex: 1; display: flex; flex-direction: column; gap: var(--space-2); font-size: var(--text-sm); }
  .step__actions { display: flex; gap: var(--space-2); margin-top: var(--space-4); }

  .field { display: flex; flex-direction: column; gap: var(--space-1); }
  .field > span { font-size: var(--text-sm); font-weight: 500; }
  .field input[type="text"], .field input[type="number"], .field textarea { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: var(--space-2) var(--space-3); color: var(--color-text-primary); font-family: var(--font-body); font-size: var(--text-sm); }
  .field textarea { resize: vertical; }
  .field__hint { font-size: var(--text-xs); color: var(--color-text-secondary); }
  .field__radios { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .field__radio { display: flex; align-items: center; gap: var(--space-1); padding: var(--space-1) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-sm); cursor: pointer; font-size: var(--text-sm); transition: all var(--transition-fast); }
  .field__radio input { display: none; }
  .field__radio--selected { border-color: var(--color-accent-primary); background: rgba(240,136,62,0.1); }
  .field__style-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); }
  .field__style-card { padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); cursor: pointer; transition: all var(--transition-fast); }
  .field__style-card--selected { border-color: var(--color-accent-primary); background: rgba(240,136,62,0.1); }
  .field__style-card strong { display: block; font-size: var(--text-sm); }
  .field__style-card small { font-size: var(--text-xs); color: var(--color-text-secondary); }
  .field__checklist { display: flex; flex-direction: column; gap: var(--space-2); }
  .field__checkbox { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); cursor: pointer; }
  .field__cascade { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); }

  .builder__nav { display: flex; align-items: center; justify-content: space-between; padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
  .builder__nav-step { font-size: var(--text-sm); color: var(--color-text-secondary); font-family: var(--font-display); }

  @media (max-width: 768px) {
    .builder__layout { grid-template-columns: 1fr; }
    .builder__preview { position: static; }
    .field__style-grid { grid-template-columns: 1fr; }
    .step__trigger-builder { flex-direction: column; }
  }
</style>
