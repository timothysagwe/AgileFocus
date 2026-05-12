<script>
  import { navigate } from '../router.js';

  export let href = '';

  function onClick(e) {
    if (e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    navigate(href);
  }
</script>

<a {href} on:click={onClick}><slot /></a>

<style>
  a {
    color: var(--color-accent-secondary);
    text-decoration: none;
  }
  a:hover {
    color: var(--color-text-primary);
  }
</style>
