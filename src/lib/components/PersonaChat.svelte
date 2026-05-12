<script>
  import { PersonaEngine } from '../engines/persona-engine.js';

  export let persona = null;
  export let projectState = {};
  export let byokClient = null;

  let messages = [];
  let inputText = '';
  let engine;

  $: if (persona && projectState) {
    initEngine();
  }

  function initEngine() {
    engine = new PersonaEngine([persona], { ...projectState });
    messages = [];
    const trust = engine.getPersonaTrustScore(persona?.id);
    messages.push({ role: 'system', text: `You are speaking with ${persona?.name}, ${persona?.role}. Current trust: ${trust}/100.`, _cls: 'p-chat__msg--system' });
  }

  async function send() {
    const text = inputText.trim();
    if (!text || !engine) return;
    messages = [...messages, { role: 'user', text, _cls: 'p-chat__msg--user' }];
    inputText = '';

    let response;

    if (byokClient?.isAvailable()) {
      response = await byokClient.sendPersonaMessage(persona, projectState, text);
      const personaResp = engine.getPersonaResponse(persona?.id, '', null);
      if (!response) response = personaResp;
    } else {
      response = engine.getPersonaResponse(persona?.id, text, null);
    }

    const events = engine.updateState({});

    events.forEach(ev => {
      messages = [...messages, { role: 'event', text: `[${ev.severity.toUpperCase()}] ${ev.persona_name}: ${ev.response_text} (Trust: ${ev.trust_before} → ${ev.trust_after})`, _cls: 'p-chat__msg--event' }];
    });

    messages = [...messages, { role: 'assistant', text: response || '...', _cls: 'p-chat__msg--assistant' }];
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  $: currentTrust = engine?.getPersonaTrustScore(persona?.id) ?? 50;

  $: trustClass = currentTrust > 70 ? 'p-chat__trust--allied' : currentTrust >= 40 ? 'p-chat__trust--neutral' : 'p-chat__trust--hostile';
</script>

<div class="p-chat">
  <div class="p-chat__header">
    <div class="p-chat__header-info">
      <strong>{persona?.name || 'Persona'}</strong>
      <span class="p-chat__role">{persona?.role || ''}</span>
    </div>
    <div class="p-chat__trust {trustClass}">
      Trust: {currentTrust}
    </div>
    <div class="p-chat__mode">
      {byokClient ? 'AI Mode' : 'Logic Layer'}
    </div>
  </div>

  <div class="p-chat__messages">
    {#each messages as msg, i (i)}
      <div class="p-chat__msg {msg._cls}">
        {msg.text}
      </div>
    {/each}
  </div>

  <div class="p-chat__input">
    <textarea bind:value={inputText} on:keydown={handleKeydown} placeholder="Type your message..." rows="2"></textarea>
    <button class="p-chat__send" on:click={send} disabled={!inputText.trim()}>Send</button>
  </div>
</div>

<style>
  .p-chat { display: flex; flex-direction: column; height: 400px; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; background: var(--color-bg-surface); }
  .p-chat__header { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); background: var(--color-bg-secondary); border-bottom: 1px solid var(--color-border); font-size: var(--text-sm); }
  .p-chat__header-info { flex: 1; }
  .p-chat__role { color: var(--color-text-secondary); font-size: var(--text-xs); display: block; }
  .p-chat__trust { font-family: var(--font-display); font-size: var(--text-xs); padding: 2px var(--space-2); border-radius: var(--radius-sm); }
  .p-chat__trust--allied { color: var(--color-accent-success); background: rgba(63,185,80,0.1); }
  .p-chat__trust--neutral { color: var(--color-accent-primary); background: rgba(240,136,62,0.1); }
  .p-chat__trust--hostile { color: var(--color-accent-danger); background: rgba(248,81,73,0.1); }
  .p-chat__mode { font-size: var(--text-xs); color: var(--color-text-secondary); font-family: var(--font-display); }
  .p-chat__messages { flex: 1; overflow-y: auto; padding: var(--space-3); display: flex; flex-direction: column; gap: var(--space-2); }
  .p-chat__msg { padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); font-size: var(--text-sm); max-width: 85%; }
  .p-chat__msg--user { background: var(--color-bg-primary); align-self: flex-end; }
  .p-chat__msg--assistant { background: var(--color-bg-secondary); align-self: flex-start; border: 1px solid var(--color-border); }
  .p-chat__msg--system { align-self: center; font-size: var(--text-xs); color: var(--color-text-secondary); font-style: italic; }
  .p-chat__msg--event { align-self: center; font-size: var(--text-xs); color: var(--color-accent-warning); background: rgba(210,153,34,0.1); padding: var(--space-1) var(--space-3); border-radius: var(--radius-sm); }
  .p-chat__input { display: flex; gap: var(--space-2); padding: var(--space-3); border-top: 1px solid var(--color-border); }
  .p-chat__input textarea { flex: 1; background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: var(--space-2); font-size: var(--text-sm); color: var(--color-text-primary); font-family: var(--font-body); resize: none; }
  .p-chat__send { background: var(--color-accent-primary); color: var(--color-bg-primary); border: none; border-radius: var(--radius-sm); padding: var(--space-2) var(--space-4); font-weight: 500; cursor: pointer; font-family: var(--font-body); align-self: flex-end; }
  .p-chat__send:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
