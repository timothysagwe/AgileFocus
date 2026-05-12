import App from './App.svelte';
import { base } from './lib/base-path.js';

const app = new App({
  target: document.getElementById('app')
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(`${base}sw.js`)
    .then(() => console.log('[AgileFocus] Service worker registered'))
    .catch((err) => console.warn('[AgileFocus] Service worker registration failed:', err));
}

export default app;
