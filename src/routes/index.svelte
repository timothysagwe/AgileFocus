<script>
  import { navigate } from '../lib/router.js';
  import { progress } from '../lib/stores/progress.js';
  import Button from '../lib/components/Button.svelte';
  import Badge from '../lib/components/Badge.svelte';

  $: hasProgress = $progress.completed_exercises.length > 0 || $progress.completed_modules.length > 0 || $progress.completed_simulations.length > 0;

  $: lastActivity = $progress.completed_exercises.length > 0 ? '/bpmn' : $progress.completed_simulations.length > 0 ? '/simulator' : $progress.completed_modules.length > 0 ? '/learn' : null;

  const features = [
    { id: 'bpmn', title: 'BPMN Process Modelling', desc: 'Interactive exercises from comprehension to audit. Model processes in a regulated context and get scored against a compliance rubric.', cta: 'Start BPMN', href: '/bpmn', tier: '3 Tiers', color: 'var(--color-accent-secondary)' },
    { id: 'sim', title: 'Agile Simulation', desc: 'Run a 6-sprint fraud alert triage project at a challenger bank. Balance Agile delivery with regulatory deadlines, stakeholder pressure, and audit readiness.', cta: 'Run Simulation', href: '/simulator', tier: '6 Sprints', color: 'var(--color-accent-primary)' },
    { id: 'gov', title: 'Regulated Agile Governance', desc: '6 modules covering CAB integration, Definition of Done, traceability, release management, evidence packs, and DORA — all with hands-on exercises.', cta: 'Learn Governance', href: '/learn/governance', tier: '6 Modules', color: 'var(--color-regulatory)' },
    { id: 'personas', title: 'Stakeholder Personas', desc: '8 pre-built personas reflecting real FS and government stakeholders. Chat with them in character, or build your own using the persona builder.', cta: 'Explore Personas', href: '/personas', tier: '8 Personas', color: 'var(--color-accent-secondary)' },
    { id: 'certs', title: 'Certification Tracking', desc: 'Map your knowledge to PSM I, PMI-ACP, AgilePM, BCS BA Diploma, and GDS Standard. 100 knowledge-check questions with domain-level breakdown.', cta: 'View Certifications', href: '/learn/certifications', tier: '5 Certifications', color: 'var(--color-accent-success)' },
    { id: 'contribute', title: 'Community Contributions', desc: 'Built by practitioners for practitioners. Contribute scenarios, personas, or exercises — no code required. Every PR is validated against JSON schemas.', cta: 'Contribute', href: 'https://github.com/opencode/agilefocus/blob/main/CONTRIBUTING.md', tier: 'Open Source', color: 'var(--color-accent-primary)' }
  ];

  const certifications = [
    { name: 'PSM I', full: 'Professional Scrum Master I' },
    { name: 'PSM II', full: 'Professional Scrum Master II' },
    { name: 'PMI-ACP', full: 'PMI Agile Certified Practitioner' },
    { name: 'AgilePM', full: 'AgilePM (DSDM)' },
    { name: 'BCS BA', full: 'BCS Business Analysis Diploma' },
    { name: 'GDS', full: 'GDS Service Standard' }
  ];

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
</script>

<div class="landing">

  <!-- HERO -->
  <section class="hero">
    <div class="hero__bg"></div>
    <div class="hero__content">
      <h1 class="hero__wordmark">
        <span class="hero__a">A</span>gile<span class="hero__f">F</span>ocus
      </h1>
      <p class="hero__tagline">IT Project Management and Business Analysis in Agile,<br />built for financial services and government.</p>
      <div class="hero__actions">
        <Button variant="primary" size="lg" on:click={() => navigate('/learn')}>Start Learning</Button>
        <Button variant="ghost" size="lg" on:click={() => scrollTo('features')}>See What's Included</Button>
      </div>
      {#if hasProgress}
        <div class="hero__return">
          <p>Welcome back. <a href={lastActivity || '/learn'}>Continue where you left off</a></p>
          <div class="hero__stats">
            <Badge variant="level" text="Level {$progress.level}" />
            <span>{$progress.completed_exercises.length} exercises</span>
            <span>{$progress.completed_modules.length} modules</span>
            <span>{$progress.completed_simulations.length} simulations</span>
          </div>
        </div>
      {/if}
    </div>
  </section>

  <!-- FEATURES -->
  <section class="features" id="features">
    <h2 class="section__title">What's Inside</h2>
    <div class="features__grid">
      {#each features as f (f.id)}
        <div class="feature__card" style="--feature-accent: {f.color};">
          <div class="feature__card-header">
            <span class="feature__tier-badge">{f.tier}</span>
          </div>
          <h3 class="feature__title">{f.title}</h3>
          <p class="feature__desc">{f.desc}</p>
          {#if f.id === 'contribute'}
            <a href={f.href} target="_blank" rel="noopener noreferrer" class="feature__cta">{f.cta} &rarr;</a>
          {:else}
            <button class="feature__cta" on:click={() => navigate(f.href)}>{f.cta} &rarr;</button>
          {/if}
        </div>
      {/each}
    </div>
  </section>

  <!-- CERTIFICATIONS -->
  <section class="certs">
    <h2 class="section__title">Aligned to These Certifications</h2>
    <p class="section__subtitle">Track your knowledge against six recognised frameworks</p>
    <div class="certs__grid">
      {#each certifications as cert (cert.name)}
        <div class="cert__card">
          <span class="cert__name">{cert.name}</span>
          <span class="cert__full">{cert.full}</span>
        </div>
      {/each}
    </div>
  </section>

  <!-- FOR PRACTITIONERS -->
  <section class="manifesto">
    <div class="manifesto__content">
      <h2 class="section__title">For Practitioners</h2>
      <p class="manifesto__text">
        Most Agile training ignores the reality of working in a regulated environment.
        It teaches you Scrum in a vacuum — but nobody's Scrum Master told them how to
        get a change through CAB, what an evidence pack looks like, or how to handle
        a regulatory finding mid-sprint.
      </p>
      <p class="manifesto__text">
        AgileFocus is built around the tensions you actually face:
        <strong>change governance boards</strong> that meet once a week,
        <strong>audit evidence requirements</strong> that must be met before deployment,
        <strong>regulatory deadlines</strong> that cannot be slipped, and
        <strong>stakeholders</strong> who don't understand why Agile doesn't mean
        "faster."
      </p>
      <p class="manifesto__text">
        If this is your world, this sandbox is for you. No account, no vendor, no cost.
        Just practice.
      </p>
    </div>
  </section>

  <!-- CONTRIBUTE -->
  <section class="contribute">
    <div class="contribute__card">
      <h2 class="section__title">Built by Practitioners, for Practitioners</h2>
      <p class="contribute__text">
        You work in a regulated environment. You know what a realistic CAB submission
        looks like, what tensions a Product Owner really creates, and what BPMN processes
        a BA actually models. Share that knowledge.
      </p>
      <p class="contribute__text">
        No code required. Write a single JSON file, validate it with one command, and
        open a pull request. Your contribution is automatically validated against our
        schemas and tested before review.
      </p>
      <div class="contribute__actions">
        <a href="https://github.com/opencode/agilefocus/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">
          <Button variant="primary" size="md">Read the Contribution Guide</Button>
        </a>
        <a href="https://github.com/opencode/agilefocus" target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="md">View on GitHub</Button>
        </a>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="footer__content">
      <span class="footer__license">MIT License</span>
      <a href="https://github.com/opencode/agilefocus" target="_blank" rel="noopener noreferrer" class="footer__link">GitHub</a>
      <span class="footer__tech">Built with Svelte &amp; bpmn-js</span>
      <span class="footer__privacy">No analytics &middot; No cookies &middot; No tracking</span>
    </div>
  </footer>
</div>

<style>
  .landing { display: flex; flex-direction: column; }

  .section__title { font-size: var(--text-3xl); font-family: var(--font-display); letter-spacing: -0.02em; margin-bottom: var(--space-2); }
  .section__subtitle { font-size: var(--text-base); color: var(--color-text-secondary); margin-bottom: var(--space-8); }

  /* HERO */
  .hero { position: relative; min-height: 70vh; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: var(--space-12) var(--space-6); }
  .hero__bg { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 0%, rgba(240, 136, 62, 0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(88, 166, 255, 0.04) 0%, transparent 50%); pointer-events: none; }
  .hero__content { position: relative; text-align: center; max-width: 720px; display: flex; flex-direction: column; align-items: center; gap: var(--space-6); }
  .hero__wordmark { font-family: var(--font-display); font-size: clamp(2.5rem, 8vw, 5rem); font-weight: 700; letter-spacing: -0.03em; line-height: 1; }
  .hero__a, .hero__f { color: var(--color-accent-primary); }
  .hero__tagline { font-size: clamp(var(--text-base), 2.5vw, var(--text-xl)); color: var(--color-text-secondary); line-height: 1.6; max-width: 540px; }
  .hero__actions { display: flex; gap: var(--space-4); flex-wrap: wrap; justify-content: center; }
  .hero__return { margin-top: var(--space-4); padding: var(--space-4) var(--space-6); border: 1px solid var(--color-border); border-radius: var(--radius-lg); text-align: center; font-size: var(--text-sm); }
  .hero__return a { color: var(--color-accent-secondary); text-decoration: none; }
  .hero__return a:hover { text-decoration: underline; }
  .hero__stats { display: flex; gap: var(--space-3); justify-content: center; margin-top: var(--space-2); font-family: var(--font-display); font-size: var(--text-xs); color: var(--color-text-secondary); }

  /* FEATURES */
  .features { padding: var(--space-16) var(--space-6); max-width: 1200px; margin: 0 auto; width: 100%; }
  .features__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-4); margin-top: var(--space-8); }
  .feature__card { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-6); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-bg-surface); transition: border-color var(--transition-fast), transform var(--transition-fast); }
  .feature__card:hover { border-color: var(--feature-accent, var(--color-accent-primary)); transform: translateY(-2px); }
  .feature__card-header { display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1); }
  .feature__tier-badge { font-family: var(--font-display); font-size: var(--text-xs); color: var(--feature-accent, var(--color-accent-primary)); text-transform: uppercase; letter-spacing: 0.05em; }
  .feature__title { font-size: var(--text-xl); font-weight: 600; }
  .feature__desc { font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.6; flex: 1; }
  .feature__cta { background: none; border: none; color: var(--feature-accent, var(--color-accent-primary)); font-family: var(--font-body); font-size: var(--text-sm); font-weight: 500; cursor: pointer; padding: 0; text-align: left; text-decoration: none; display: inline-flex; align-items: center; gap: var(--space-1); transition: gap var(--transition-fast); }
  .feature__cta:hover { gap: var(--space-2); }

  /* CERTIFICATIONS */
  .certs { padding: var(--space-16) var(--space-6); text-align: center; background: var(--color-bg-secondary); }
  .certs__grid { display: flex; flex-wrap: wrap; gap: var(--space-4); justify-content: center; max-width: 800px; margin: 0 auto; }
  .cert__card { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); padding: var(--space-4) var(--space-6); min-width: 140px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg-surface); }
  .cert__name { font-family: var(--font-display); font-size: var(--text-base); font-weight: 600; }
  .cert__full { font-size: var(--text-xs); color: var(--color-text-secondary); text-align: center; }

  /* MANIFESTO */
  .manifesto { padding: var(--space-16) var(--space-6); max-width: 680px; margin: 0 auto; }
  .manifesto__content { display: flex; flex-direction: column; gap: var(--space-4); }
  .manifesto__text { font-size: var(--text-base); line-height: 1.7; color: var(--color-text-secondary); }
  .manifesto__text strong { color: var(--color-text-primary); }

  /* CONTRIBUTE */
  .contribute { padding: var(--space-16) var(--space-6); }
  .contribute__card { max-width: 680px; margin: 0 auto; padding: var(--space-8); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-bg-surface); text-align: center; display: flex; flex-direction: column; gap: var(--space-4); align-items: center; }
  .contribute__text { font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.6; max-width: 540px; }
  .contribute__actions { display: flex; gap: var(--space-3); flex-wrap: wrap; justify-content: center; margin-top: var(--space-2); }

  /* FOOTER */
  .footer { padding: var(--space-8) var(--space-6); border-top: 1px solid var(--color-border); }
  .footer__content { max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: center; font-size: var(--text-xs); color: var(--color-text-secondary); }
  .footer__license { font-family: var(--font-display); font-weight: 600; }
  .footer__link { color: var(--color-accent-secondary); text-decoration: none; }
  .footer__link:hover { text-decoration: underline; }
  .footer__tech { margin-left: auto; }
  .footer__privacy { width: 100%; text-align: center; color: var(--color-text-tertiary, var(--color-text-secondary)); opacity: 0.7; }

  @media (max-width: 640px) {
    .features__grid { grid-template-columns: 1fr; }
    .certs__grid { gap: var(--space-3); }
    .cert__card { min-width: 120px; padding: var(--space-3) var(--space-4); }
    .hero__actions { flex-direction: column; align-items: center; }
  }
</style>
