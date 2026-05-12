<script>
  import { onMount, onDestroy, tick } from 'svelte';

  export let open = false;
  export let title = '';
  export let size = 'md';

  let dialog;
  let previousFocus;
  let focusableElements = [];

  const sizeMap = {
    sm: 'modal--sm',
    md: 'modal--md',
    lg: 'modal--lg'
  };

  $: modalClasses = ['modal', sizeMap[size] || 'modal--md'].join(' ');
  $: if (open) {
    tick().then(() => openModal());
  }

  function openModal() {
    previousFocus = document.activeElement;
    trapFocus();
  }

  function closeModal() {
    open = false;
    if (previousFocus) previousFocus.focus();
  }

  function onBackdropClick(e) {
    if (e.target === e.currentTarget) closeModal();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') handleTabTrap(e);
  }

  function handleTabTrap(e) {
    if (!dialog) return;
    const els = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusableElements = Array.from(els).filter(el => !el.disabled);
    if (focusableElements.length === 0) return;

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function trapFocus() {
    if (!dialog) return;
    const els = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusableElements = Array.from(els).filter(el => !el.disabled);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }
</script>

<svelte:window on:keydown={onKeydown} />

{#if open}
  <div class="modal__backdrop" on:click={onBackdropClick} role="presentation"></div>
  <div class="modal__wrapper" role="dialog" aria-modal="true" aria-label={title} bind:this={dialog}>
    <div class={modalClasses}>
      <div class="modal__header">
        <h2 class="modal__title">{title}</h2>
        <button class="modal__close" on:click={closeModal} aria-label="Close">&times;</button>
      </div>
      <div class="modal__body">
        <slot />
      </div>
      {#if $$slots.footer}
        <div class="modal__footer">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal__backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: var(--z-overlay);
  }

  .modal__wrapper {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
    padding: var(--space-4);
  }

  .modal {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    max-height: 85vh;
    width: 100%;
    animation: modal-in 200ms ease-out;
  }

  .modal--sm { max-width: 400px; }
  .modal--md { max-width: 560px; }
  .modal--lg { max-width: 720px; }

  .modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-6);
    border-bottom: 1px solid var(--color-border);
  }

  .modal__title {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 600;
  }

  .modal__close {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    font-size: var(--text-2xl);
    cursor: pointer;
    padding: var(--space-1);
    line-height: 1;
    border-radius: var(--radius-sm);
    transition: color var(--transition-fast);
  }
  .modal__close:hover {
    color: var(--color-text-primary);
  }

  .modal__body {
    padding: var(--space-6);
    overflow-y: auto;
    flex: 1;
  }

  .modal__footer {
    display: flex;
    gap: var(--space-3);
    justify-content: flex-end;
    padding: var(--space-4) var(--space-6);
    border-top: 1px solid var(--color-border);
  }

  @keyframes modal-in {
    from { opacity: 0; transform: scale(0.96) translateY(8px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
</style>
