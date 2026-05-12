<script>
  import { onMount, onDestroy } from 'svelte';
  import { progress } from '../../lib/stores/progress.js';
  import { getExercise, getModelXml } from '../../lib/bpmn-data.js';
  import { evaluate } from '../../lib/engines/bpmn-evaluator.js';
  import { navigate } from '../../lib/router.js';
  import BpmnViewer from '../../lib/components/BpmnViewer.svelte';
  import BpmnModeller from '../../lib/components/BpmnModeller.svelte';
  import EvaluationPanel from '../../lib/components/EvaluationPanel.svelte';
  import Button from '../../lib/components/Button.svelte';
  import Badge from '../../lib/components/Badge.svelte';
  import Card from '../../lib/components/Card.svelte';
  import Link from '../../lib/components/Link.svelte';
  import FeatureGate from '../../lib/components/FeatureGate.svelte';
  import { getDefaultClient } from '../../lib/engines/byok-client.js';

  export let exerciseId = '';

  let exercise = null;
  let modelXml = '';
  let error = '';

  onMount(async () => {
    exercise = getExercise(exerciseId);
    if (!exercise) {
      error = 'Exercise not found';
      return;
    }
    if (exercise.tier === 1 || exercise.tier === 3) {
      modelXml = await getModelXml(exerciseId);
    }
  });

  /* --- Tier 1 state --- */
  let selectedAnswers = {};
  let tier1Submitted = false;
  let tier1Score = 0;

  /* --- BYOK state --- */
  let aiFeedback = '';
  let aiFeedbackLoading = false;

  async function loadAIFeedback() {
    if (aiFeedbackLoading || aiFeedback) return;
    aiFeedbackLoading = true;
    const byokClient = getDefaultClient();
    if (byokClient?.isAvailable()) {
      const context = exercise?.context || 'BPMN exercise';
      const result = evalResult || tier3Result || { percentage: 0, score: 0 };
      const feedback = await byokClient.getBPMNFeedback(modelXml, result, context);
      if (feedback) aiFeedback = feedback;
    }
    aiFeedbackLoading = false;
  }

  /* --- Tier 2 state --- */
  let modeller;
  let evalResult = null;
  let evalVisible = false;
  let evaluating = false;

  /* --- Tier 3 state --- */
  let problemReports = [];
  let tier3Submitted = false;
  let tier3Result = null;

  $: isComplete = $progress.completed_exercises?.includes(exerciseId) || false;

  function selectAnswer(qId, answer) {
    selectedAnswers[qId] = answer;
  }

  function submitTier1() {
    if (!exercise || !exercise.questions) return;
    let correct = 0;
    const total = exercise.questions.length;
    for (const q of exercise.questions) {
      if (selectedAnswers[q.id] === q.correct_answer) correct++;
    }
    tier1Score = Math.round((correct / total) * (exercise.max_points || total));
    tier1Submitted = true;
    if (tier1Score / (exercise.max_points || total) >= 0.7) {
      markComplete();
    }
  }

  async function evaluateTier2() {
    if (!modeller || !exercise?.rubric) return;
    evaluating = true;
    const xml = await modeller.getXml();
    evalResult = evaluate(xml, { max_points: exercise.rubric.max_points, rubric: exercise.rubric });
    evalVisible = true;
    evaluating = false;
    if (evalResult.passed) markComplete();
  }

  function resetTier2() {
    if (modeller) modeller.resetDiagram();
    evalResult = null;
    evalVisible = false;
  }

  async function downloadBpmn() {
    if (!modeller) return;
    const xml = await modeller.getXml();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exerciseId}.bpmn`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function addProblem() {
    problemReports = [...problemReports, { id: Date.now(), type: '', location: '', reason: '' }];
  }

  function removeProblem(id) {
    problemReports = problemReports.filter(p => p.id !== id);
  }

  function updateProblem(id, field, value) {
    problemReports = problemReports.map(p => p.id === id ? { ...p, [field]: value } : p);
  }

  function submitTier3() {
    if (!exercise?.rubric) return;
    const antipatterns = exercise.rubric.forbidden_antipatterns || [];
    const foundTypes = problemReports.map(p => p.type).filter(Boolean);
    let score = 0;
    const results = antipatterns.map(ap => {
      const found = foundTypes.includes(ap.pattern_id);
      if (found) score += ap.penalty ? Math.abs(ap.penalty) : 3;
      return { pattern_id: ap.pattern_id, found, expected: true, feedback: ap.description };
    });
    const falsePositives = foundTypes.filter(t => !antipatterns.some(ap => ap.pattern_id === t));
    const fpPenalty = falsePositives.length * 2;
    score = Math.max(0, score - fpPenalty);
    const maxScore = antipatterns.reduce((s, ap) => s + (ap.penalty ? Math.abs(ap.penalty) : 3), 0);
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    tier3Result = { score, percentage: pct, passed: pct >= 70, results, falsePositives };
    tier3Submitted = true;
    if (pct >= 70) markComplete();
  }

  function markComplete() {
    progress.update(p => {
      if (p.completed_exercises.includes(exerciseId)) return p;
      return { ...p, completed_exercises: [...p.completed_exercises, exerciseId] };
    });
  }

  $: isTier1 = exercise?.tier === 1;
  $: isTier2 = exercise?.tier === 2;
  $: isTier3 = exercise?.tier === 3;

  function onKeydown(e) {
    if (!isTier2) return;
    if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
      e.preventDefault();
      evaluateTier2();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
      e.preventDefault();
      resetTier2();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      downloadBpmn();
    }
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="exercise">
  {#if error}
    <div class="exercise__error">
      <h2>Error</h2>
      <p>{error}</p>
      <Link href="/bpmn"><Button variant="secondary" size="sm">Back to BPMN Exercises</Button></Link>
    </div>
  {:else if !exercise}
    <p class="exercise__loading">Loading exercise...</p>
  {:else}
    <header class="exercise__header">
      <div class="exercise__breadcrumb">
        <Link href="/bpmn">BPMN</Link>
        <span class="exercise__sep">/</span>
        <span>{exercise.title}</span>
      </div>
      <div class="exercise__meta">
        <Badge variant="level" text="Tier {exercise.tier}" />
        <Badge variant="level" text="Level {exercise.level_required}" />
        {#if isComplete}
          <Badge variant="success" text="Complete" />
        {/if}
      </div>
    </header>

    <div class="exercise__context">
      <Card>
        <p class="exercise__context-text">{exercise.context}</p>
      </Card>
    </div>

    <div class="exercise__instructions">
      <h3>Instructions</h3>
      <p>{exercise.instructions}</p>
    </div>

    <!-- TIER 1 -->
    {#if isTier1}
      <div class="tier1">
        <div class="tier1__diagram">
          <BpmnViewer xml={modelXml} height={500} />
        </div>

        {#if exercise.questions}
          <div class="tier1__questions">
            <h3>Questions</h3>
            {#each exercise.questions as q, i (q.id)}
              <div class="tier1__question" class:tier1__question--submitted={tier1Submitted}>
                <p class="tier1__q-text">{i + 1}. {q.question}</p>
                {#if q.options}
                  <div class="tier1__options">
                    {#each q.options as opt}
                      <label class="tier1__option" class:tier1__option--correct={tier1Submitted && opt === q.correct_answer} class:tier1__option--wrong={tier1Submitted && selectedAnswers[q.id] === opt && opt !== q.correct_answer}>
                        <input type="radio" name={q.id} value={opt} disabled={tier1Submitted} checked={selectedAnswers[q.id] === opt} on:change={() => selectAnswer(q.id, opt)} />
                        <span>{opt}</span>
                      </label>
                    {/each}
                  </div>
                {/if}
                {#if tier1Submitted}
                  <p class="tier1__feedback" class:tier1__feedback--pass={selectedAnswers[q.id] === q.correct_answer} class:tier1__feedback--fail={selectedAnswers[q.id] !== q.correct_answer}>
                    {selectedAnswers[q.id] === q.correct_answer ? 'Correct' : 'Incorrect'}
                  </p>
                {/if}
              </div>
            {/each}

            {#if !tier1Submitted}
              <Button variant="primary" size="md" on:click={submitTier1}>Submit Answers</Button>
            {:else}
              <div class="tier1__score">
                <Badge variant={tier1Score / (exercise.max_points || 1) >= 0.7 ? 'success' : 'warning'} text="Score: {tier1Score} / {exercise.max_points}" />
              </div>
              <FeatureGate>
                <div slot="ai">
                  {#if aiFeedbackLoading}
                    <p class="exercise__ai-loading">Generating AI feedback...</p>
                  {:else if aiFeedback}
                    <Card variant="info">
                      <h4>AI Coaching Feedback</h4>
                      <p class="exercise__ai-text">{aiFeedback}</p>
                    </Card>
                  {:else if !aiFeedback}
                    <Button variant="ghost" size="sm" on:click={loadAIFeedback}>Get AI Coaching</Button>
                  {/if}
                </div>
                <div slot="fallback"></div>
              </FeatureGate>
              <Link href="/bpmn"><Button variant="secondary" size="sm">Back to Exercises</Button></Link>
            {/if}
          </div>
        {/if}
      </div>
    {/if}

    <!-- TIER 2 -->
    {#if isTier2}
      <div class="tier2">
        <div class="tier2__sidebar">
          <Card variant="regulatory">
            <h3 class="tier2__sidebar-title">Process Description</h3>
            <p class="tier2__desc">{exercise.context}</p>
          </Card>

          <Card>
            <h3 class="tier2__sidebar-title">Key Requirements</h3>
            {#if exercise.rubric?.required_elements}
              <ul class="tier2__reqs">
                {#each exercise.rubric.required_elements as req}
                  <li>{req.description}</li>
                {/each}
              </ul>
            {/if}
            {#if exercise.rubric?.required_patterns}
              <ul class="tier2__reqs">
                {#each exercise.rubric.required_patterns as pat}
                  <li>{pat.description}</li>
                {/each}
              </ul>
            {/if}
          </Card>

          {#if exercise.rubric?.max_points}
            <p class="tier2__max">Max points: {exercise.rubric.max_points}</p>
          {/if}
        </div>

        <div class="tier2__modeller">
          <div class="tier2__toolbar">
            <Button variant="primary" size="sm" on:click={evaluateTier2} loading={evaluating}>Evaluate</Button>
            <Button variant="secondary" size="sm" on:click={resetTier2}>Reset</Button>
            <Button variant="ghost" size="sm" on:click={downloadBpmn}>Download .bpmn</Button>
            <span class="tier2__shortcuts">Ctrl+E Eval &middot; Ctrl+R Reset &middot; Ctrl+S Download</span>
          </div>
          <BpmnModeller bind:this={modeller} exerciseId={exerciseId} height={600} />
        </div>
      </div>

      <EvaluationPanel result={evalResult} visible={evalVisible} />
      {#if evalVisible && evalResult}
        <FeatureGate>
          <div slot="ai">
            {#if aiFeedbackLoading}
              <p class="exercise__ai-loading">Generating AI feedback...</p>
            {:else if aiFeedback}
              <Card variant="info">
                <h4>AI Coaching Feedback</h4>
                <p class="exercise__ai-text">{aiFeedback}</p>
              </Card>
            {:else}
              <Button variant="ghost" size="sm" on:click={loadAIFeedback}>Get AI Coaching</Button>
            {/if}
          </div>
          <div slot="fallback"></div>
        </FeatureGate>
      {/if}
    {/if}

    <!-- TIER 3 -->
    {#if isTier3}
      <div class="tier3">
        <div class="tier3__diagram">
          <BpmnViewer xml={modelXml} height={500} />
        </div>

        <div class="tier3__panel">
          <div class="tier3__panel-header">
            <h3>Problem Reports</h3>
            {#if !tier3Submitted}
              <Button variant="secondary" size="sm" on:click={addProblem}>+ Add Problem</Button>
            {/if}
          </div>

          {#if problemReports.length === 0 && !tier3Submitted}
            <p class="tier3__empty">Click "Add Problem" to report issues you find in the diagram.</p>
          {/if}

          {#each problemReports as report (report.id)}
            <div class="tier3__report">
              <div class="tier3__report-row">
                <select value={report.type} disabled={tier3Submitted} on:change={e => updateProblem(report.id, 'type', e.target.value)}>
                  <option value="">Select problem type...</option>
                  <option value="disconnected_elements">Disconnected / Orphaned Element</option>
                  <option value="missing_error_events">Missing Error Boundary Event</option>
                  <option value="no_default_gateway_path">Missing Default Gateway Path</option>
                  <option value="single_lane_only">Single Lane Only</option>
                  <option value="no_exception_path">No Exception Path</option>
                </select>
                {#if !tier3Submitted}
                  <button class="tier3__remove" on:click={() => removeProblem(report.id)} aria-label="Remove problem">&times;</button>
                {/if}
              </div>
              <input type="text" placeholder="Location (element name/ID)" value={report.location} disabled={tier3Submitted} on:input={e => updateProblem(report.id, 'location', e.target.value)} />
              <textarea placeholder="Why this is a regulatory concern..." value={report.reason} disabled={tier3Submitted} on:input={e => updateProblem(report.id, 'reason', e.target.value)} rows="2"></textarea>
            </div>
          {/each}

          {#if !tier3Submitted && problemReports.length > 0}
            <Button variant="primary" size="md" on:click={submitTier3}>Submit Findings</Button>
          {/if}

          {#if tier3Result}
            <div class="tier3__result">
              <h3>Evaluation Results</h3>
              <div class="tier3__result-score">
                <Badge variant={tier3Result.passed ? 'success' : 'danger'} text="{tier3Result.percentage}%" />
                <span>{tier3Result.score} points</span>
              </div>
              <div class="tier3__result-details">
                {#each tier3Result.results as r}
                  <div class="tier3__result-item" class:tier3__result-item--found={r.found} class:tier3__result-item--missed={!r.found}>
                    <span>{r.found ? 'Found' : 'Missed'}: {r.feedback}</span>
                  </div>
                {/each}
                {#if tier3Result.falsePositives.length > 0}
                  <div class="tier3__result-item tier3__result-item--fp">
                    <span>False positives: {tier3Result.falsePositives.join(', ')} (-{tier3Result.falsePositives.length * 2} pts)</span>
                  </div>
                {/if}
              </div>
              <FeatureGate>
                <div slot="ai">
                  {#if aiFeedbackLoading}
                    <p class="exercise__ai-loading">Generating AI feedback...</p>
                  {:else if aiFeedback}
                    <Card variant="info">
                      <h4>AI Coaching Feedback</h4>
                      <p class="exercise__ai-text">{aiFeedback}</p>
                    </Card>
                  {:else}
                    <Button variant="ghost" size="sm" on:click={loadAIFeedback}>Get AI Coaching</Button>
                  {/if}
                </div>
                <div slot="fallback"></div>
              </FeatureGate>
              <Link href="/bpmn"><Button variant="secondary" size="sm">Back to Exercises</Button></Link>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .exercise { display: flex; flex-direction: column; gap: var(--space-6); }
  .exercise__error { text-align: center; padding: var(--space-10); }
  .exercise__loading { color: var(--color-text-secondary); }
  .exercise__header { display: flex; flex-direction: column; gap: var(--space-2); }
  .exercise__breadcrumb { font-size: var(--text-sm); color: var(--color-text-secondary); }
  .exercise__breadcrumb :global(a) { color: var(--color-accent-secondary); }
  .exercise__sep { margin: 0 var(--space-2); }
  .exercise__meta { display: flex; gap: var(--space-2); }
  .exercise__context-text { font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.6; }
  .exercise__instructions { display: flex; flex-direction: column; gap: var(--space-2); }
  .exercise__instructions h3 { font-size: var(--text-lg); }
  .exercise__instructions p { font-size: var(--text-sm); color: var(--color-text-secondary); }

  /* Tier 1 */
  .tier1 { display: flex; flex-direction: column; gap: var(--space-6); }
  .tier1__questions { display: flex; flex-direction: column; gap: var(--space-4); }
  .tier1__question { padding: var(--space-4); background: var(--color-bg-surface); border-radius: var(--radius-md); border: 1px solid var(--color-border); }
  .tier1__q-text { font-weight: 500; margin-bottom: var(--space-3); }
  .tier1__options { display: flex; flex-direction: column; gap: var(--space-2); }
  .tier1__option { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); cursor: pointer; font-size: var(--text-sm); transition: background var(--transition-fast); }
  .tier1__option:hover { background: var(--color-bg-primary); }
  .tier1__option--correct { background: rgba(63, 185, 80, 0.15) !important; }
  .tier1__option--wrong { background: rgba(248, 81, 73, 0.15) !important; }
  .tier1__feedback { font-size: var(--text-sm); margin-top: var(--space-2); font-weight: 500; }
  .tier1__feedback--pass { color: var(--color-accent-success); }
  .tier1__feedback--fail { color: var(--color-accent-danger); }
  .tier1__score { padding: var(--space-3) 0; }

  /* Tier 2 */
  .tier2 { display: grid; grid-template-columns: 300px 1fr; gap: var(--space-4); align-items: start; }
  .tier2__sidebar { display: flex; flex-direction: column; gap: var(--space-4); position: sticky; top: 72px; }
  .tier2__sidebar-title { font-size: var(--text-base); margin-bottom: var(--space-2); }
  .tier2__desc { font-size: var(--text-sm); color: var(--color-text-secondary); }
  .tier2__reqs { font-size: var(--text-sm); color: var(--color-text-secondary); padding-left: var(--space-4); display: flex; flex-direction: column; gap: var(--space-1); }
  .tier2__max { font-family: var(--font-display); font-size: var(--text-xs); color: var(--color-text-secondary); }
  .tier2__modeller { display: flex; flex-direction: column; gap: var(--space-3); }
  .tier2__toolbar { display: flex; gap: var(--space-2); align-items: center; }
  .tier2__shortcuts { font-size: var(--text-xs); color: var(--color-text-secondary); margin-left: auto; font-family: var(--font-display); }

  /* Tier 3 */
  .tier3 { display: grid; grid-template-columns: 1fr 360px; gap: var(--space-4); align-items: start; }
  .tier3__panel { display: flex; flex-direction: column; gap: var(--space-3); }
  .tier3__panel-header { display: flex; align-items: center; justify-content: space-between; }
  .tier3__empty { font-size: var(--text-sm); color: var(--color-text-secondary); padding: var(--space-4); }
  .tier3__report { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-3); display: flex; flex-direction: column; gap: var(--space-2); }
  .tier3__report-row { display: flex; gap: var(--space-2); }
  .tier3__report select, .tier3__report input, .tier3__report textarea { width: 100%; background: var(--color-bg-primary); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: var(--space-2); font-size: var(--text-sm); color: var(--color-text-primary); font-family: var(--font-body); }
  .tier3__report select option { background: var(--color-bg-primary); }
  .tier3__report textarea { resize: vertical; }
  .tier3__remove { background: none; border: none; color: var(--color-accent-danger); cursor: pointer; font-size: var(--text-lg); padding: var(--space-1); flex-shrink: 0; }
  .tier3__result { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-4); background: var(--color-bg-surface); border-radius: var(--radius-md); }
  .tier3__result-score { display: flex; align-items: center; gap: var(--space-2); }
  .tier3__result-details { display: flex; flex-direction: column; gap: var(--space-1); }
  .tier3__result-item { padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); font-size: var(--text-sm); border-left: 3px solid var(--color-accent-danger); }
  .tier3__result-item--found { border-left-color: var(--color-accent-success); }
  .tier3__result-item--missed { border-left-color: var(--color-accent-danger); }
  .tier3__result-item--fp { border-left-color: var(--color-accent-warning); }

  .exercise__ai-loading { font-size: var(--text-sm); color: var(--color-accent-secondary); padding: var(--space-2) 0; }
  .exercise__ai-text { font-size: var(--text-sm); line-height: 1.6; color: var(--color-text-secondary); white-space: pre-wrap; }

  @media (max-width: 768px) {
    .tier2 { grid-template-columns: 1fr; }
    .tier3 { grid-template-columns: 1fr; }
  }
</style>
