<script>
  import { progress } from '../../../lib/stores/progress.js';
  import Card from '../../../lib/components/Card.svelte';
  import Badge from '../../../lib/components/Badge.svelte';
  import Button from '../../../lib/components/Button.svelte';
  import { navigate } from '../../../lib/router.js';

  const topicIds = ['topic-1', 'topic-2', 'topic-3', 'topic-4', 'topic-5', 'topic-6'];

  const topicMeta = {
    'topic-1': { title: 'Running Agile inside a CAB Framework', time: '30 min', number: 1 },
    'topic-2': { title: 'Definition of Done in Controlled Environments', time: '25 min', number: 2 },
    'topic-3': { title: 'Traceability Without Killing Agile', time: '35 min', number: 3 },
    'topic-4': { title: 'Agile Release Management in Regulated Environments', time: '30 min', number: 4 },
    'topic-5': { title: 'Evidence Packs for Internal Audit', time: '40 min', number: 5 },
    'topic-6': { title: 'DORA and Operational Resilience in Project Context', time: '35 min', number: 6 }
  };

  $: completedTopics = ($progress.completed_modules || []).filter(m => m.startsWith('governance-'));
  $: completedCount = completedTopics.length;
  $: totalCount = topicIds.length;
  $: moduleComplete = completedCount >= totalCount;

  function isTopicComplete(topicId) {
    return ($progress.completed_modules || []).includes('governance-' + topicId);
  }

  function generateCertificate() {
    const name = 'AgileFocus Learner';
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const topics = topicIds.map(id => topicMeta[id].title);

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Certificate of Completion</title>
<style>
  @page { margin: 0; }
  body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'IBM Plex Sans', sans-serif; background: #0d1117; }
  .cert { width: 800px; padding: 60px; border: 3px solid #f0883e; background: #161b22; text-align: center; }
  .cert h1 { font-family: 'IBM Plex Mono', monospace; font-size: 28px; color: #f0883e; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.1em; }
  .cert h2 { font-family: 'IBM Plex Mono', monospace; font-size: 18px; color: #58a6ff; margin: 0 0 24px; }
  .cert p { color: #c9d1d9; font-size: 14px; line-height: 1.6; margin: 8px 0; }
  .cert .topics { text-align: left; margin: 24px 0; padding: 0; list-style: none; }
  .cert .topics li { color: #8b949e; font-size: 13px; padding: 4px 0; border-bottom: 1px solid #21262d; }
  .cert .topics li::before { content: '\\2713'; color: #3fb950; margin-right: 8px; }
  .cert .seal { width: 80px; height: 80px; border: 2px solid #f0883e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 24px auto 0; font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #f0883e; text-transform: uppercase; letter-spacing: 0.05em; }
</style></head>
<body>
<div class="cert">
  <h1>Certificate of Completion</h1>
  <h2>Regulated Agile Governance Module</h2>
  <p>This certifies that</p>
  <p style="font-size:20px;color:#f0f6fc;margin:12px 0;"><strong>${name}</strong></p>
  <p>has completed all six topics in the Regulated Agile Governance module.</p>
  <ul class="topics">${topics.map(t => `<li>${t}</li>`).join('')}</ul>
  <p>Date: ${date}</p>
  <div class="seal">Agile<br>Focus</div>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agilefocus-governance-certificate.html';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="hub">
  <header class="hub__header">
    <div>
      <h1>Regulated Agile Governance</h1>
      <p class="hub__subtitle">Six topics covering governance in UK financial services and government Agile environments</p>
    </div>
    <div class="hub__status">
      {#if moduleComplete}
        <Badge variant="success" text="Module Complete" />
      {/if}
      <span class="hub__count">{completedCount}/{totalCount} topics</span>
    </div>
  </header>

  {#if moduleComplete}
    <Card variant="success">
      <div class="hub__complete">
        <p>You have completed all {totalCount} topics in this module.</p>
        <Button variant="primary" on:click={generateCertificate}>Download Certificate</Button>
      </div>
    </Card>
  {/if}

  <div class="hub__grid">
    {#each topicIds as id (id)}
      {@const meta = topicMeta[id]}
      {@const done = isTopicComplete(id)}
      <button class="hub__card-btn" on:click={() => navigate('/learn/governance/' + id)}>
        <Card variant={done ? 'success' : 'default'}>
          <div class="hub__card">
            <div class="hub__card-header">
              <Badge variant="level" text="Topic {meta.number}" />
              <span class="hub__time">{meta.time}</span>
            </div>
            <h3 class="hub__card-title">{meta.title}</h3>
            {#if done}
              <Badge variant="success" text="Complete" />
            {/if}
          </div>
        </Card>
      </button>
    {/each}
  </div>
</div>

<style>
  .hub {
    display: flex;
    flex-direction: column;
    gap: var(--space-8);
  }

  .hub__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .hub__subtitle {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin-top: var(--space-1);
  }

  .hub__status {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-shrink: 0;
  }

  .hub__count {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .hub__complete {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .hub__complete p {
    font-size: var(--text-sm);
  }

  .hub__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: var(--space-4);
  }

  .hub__card-btn {
    text-decoration: none;
    color: inherit;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: block;
    width: 100%;
    text-align: left;
    font-family: inherit;
    font-size: inherit;
  }

  .hub__card {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .hub__card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .hub__card-title {
    font-size: var(--text-base);
    font-weight: 600;
  }

  .hub__time {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
    font-family: var(--font-display);
  }
</style>
