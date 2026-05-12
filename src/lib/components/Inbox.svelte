<script>
  import { sim, inbox } from '../stores/state.js';
  import { getPersona } from '../engines/persona-engine.js';

  let respondingTo = null;
  let responseText = '';

  function getPersonaName(senderId) {
    if (senderId === 'system') return 'System';
    const p = getPersona(senderId);
    return p ? p.name : senderId;
  }

  function getUrgencyColor(urgency) {
    if (urgency === 'high') return 'var(--color-red)';
    if (urgency === 'medium') return 'var(--color-yellow)';
    return 'var(--color-green)';
  }

  function startResponse(msgId) {
    respondingTo = msgId;
    responseText = '';
  }

  function cancelResponse() {
    respondingTo = null;
    responseText = '';
  }

  function sendResponse(msgId) {
    if (responseText.trim()) {
      $sim.respondToMessage(msgId, responseText.trim());
    }
    respondingTo = null;
    responseText = '';
  }
</script>

<div class="panel">
  <header class="panel-header">
    <h2>Inbox</h2>
    {#if $inbox.length > 0}
      <span class="badge">{$inbox.length}</span>
    {/if}
  </header>

  <div class="message-list">
    {#if $inbox.length === 0}
      <div class="empty-state">
        <p>No pending messages</p>
      </div>
    {:else}
      {#each $inbox as message (message.id)}
        <div class="message-card">
          <div class="message-header">
            <div class="sender-info">
              <span class="sender">{getPersonaName(message.sender_id)}</span>
              <span class="time">{message.received_at}</span>
            </div>
            <span class="urgency" style="--uc: {getUrgencyColor(message.urgency)}">
              {message.urgency}
            </span>
          </div>
          <div class="subject">{message.subject}</div>
          <div class="body">{message.body}</div>

          {#if respondingTo === message.id}
            <div class="response-form">
              <textarea 
                bind:value={responseText}
                placeholder="Type your response..."
                autofocus
              ></textarea>
              <div class="response-actions">
                <button class="btn-secondary" on:click={cancelResponse}>Cancel</button>
                <button class="btn-primary" on:click={() => sendResponse(message.id)}>Send</button>
              </div>
            </div>
          {:else}
            <div class="actions">
              <button class="btn-primary" on:click={() => startResponse(message.id)}>Respond</button>
              <button class="btn-secondary" on:click={() => $sim.delayMessage(message.id)}>Delay</button>
              <button class="btn-ghost" on:click={() => $sim.ignoreMessage(message.id)}>Ignore</button>
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .panel {
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
  }

  .panel-header h2 {
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--color-text);
  }

  .badge {
    background: var(--color-accent);
    color: var(--color-bg);
    font-size: var(--text-xs);
    font-weight: 600;
    padding: var(--space-1) var(--space-2);
    border-radius: 999px;
    min-width: 20px;
    text-align: center;
  }

  .message-list {
    overflow-y: auto;
    flex: 1;
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .empty-state {
    padding: var(--space-8);
    text-align: center;
    color: var(--color-text-muted);
  }

  .message-card {
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-4);
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-2);
  }

  .sender-info {
    display: flex;
    gap: var(--space-3);
    align-items: center;
  }

  .sender {
    font-weight: 600;
    font-size: var(--text-sm);
    color: var(--color-text);
  }

  .time {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .urgency {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    color: var(--uc);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--uc) 15%, transparent);
  }

  .subject {
    font-weight: 600;
    font-size: var(--text-sm);
    color: var(--color-text);
    margin-bottom: var(--space-1);
  }

  .body {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    line-height: 1.5;
    margin-bottom: var(--space-3);
  }

  .actions {
    display: flex;
    gap: var(--space-2);
  }

  .response-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  textarea {
    width: 100%;
    min-height: 80px;
    padding: var(--space-3);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    background: var(--color-bg-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text);
    resize: vertical;
  }

  textarea:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  .response-actions {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
  }

  button {
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    font-weight: 500;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-primary {
    background: var(--color-accent);
    color: var(--color-bg);
  }

  .btn-primary:hover {
    background: var(--color-accent-hover);
  }

  .btn-secondary {
    background: var(--color-bg-elevated);
    color: var(--color-text);
    border-color: var(--color-border);
  }

  .btn-secondary:hover {
    background: var(--color-bg-surface);
  }

  .btn-ghost {
    background: transparent;
    color: var(--color-text-secondary);
  }

  .btn-ghost:hover {
    color: var(--color-red);
    background: color-mix(in srgb, var(--color-red) 10%, transparent);
  }
</style>
