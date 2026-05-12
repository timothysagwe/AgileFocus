<script>
  import { onMount, onDestroy } from 'svelte';
  import { navigate } from '../../../lib/router.js';
  import { progress } from '../../../lib/stores/progress.js';
  import Card from '../../../lib/components/Card.svelte';
  import Badge from '../../../lib/components/Badge.svelte';
  import Button from '../../../lib/components/Button.svelte';
  import allQuestions from '../../../data/certifications/knowledge-checks.json';

  export let certId;

  const questions = allQuestions.filter(q => q.certification_id === certId).slice(0, 20);

  let currentIndex = 0;
  let selectedAnswer = -1;
  let score = 0;
  let answered = false;
  let quizComplete = false;
  let timeRemaining = 1800;
  let timerInterval;
  let domainResults = {};
  let answerHistory = [];

  const timerRunning = true;

  onMount(() => {
    timerInterval = setInterval(() => {
      timeRemaining--;
      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        finishQuiz();
      }
    }, 1000);
  });

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
  });

  $: minutes = Math.floor(timeRemaining / 60);
  $: seconds = timeRemaining % 60;
  $: currentQuestion = questions[currentIndex];
  $: progress_pct = questions.length > 0 ? Math.round((currentIndex / questions.length) * 100) : 0;

  function selectAnswer(index) {
    if (answered) return;
    selectedAnswer = index;
  }

  function confirmAnswer() {
    if (selectedAnswer < 0) return;

    const q = currentQuestion;
    const correct = selectedAnswer === q.correct_index;

    if (!domainResults[q.domain_id]) {
      domainResults[q.domain_id] = { total: 0, correct: 0, name: q.certification_id + ' > ' + q.domain_id };
    }
    domainResults[q.domain_id].total++;
    if (correct) domainResults[q.domain_id].correct++;

    answerHistory.push({
      question: q.question,
      selected: selectedAnswer,
      correct,
      explanation: q.explanation
    });

    if (correct) score++;
    answered = true;
  }

  function nextQuestion() {
    if (currentIndex >= questions.length - 1) {
      finishQuiz();
      return;
    }
    currentIndex++;
    selectedAnswer = -1;
    answered = false;
  }

  function finishQuiz() {
    clearInterval(timerInterval);
    quizComplete = true;
    const pct = Math.round((score / questions.length) * 100);

    progress.update(p => ({
      ...p,
      knowledge_check_scores: {
        ...(p.knowledge_check_scores || {}),
        ['quiz-' + certId]: pct
      }
    }));
  }

  function getDomainResult(domainId) {
    const r = domainResults[domainId];
    if (!r) return null;
    return { total: r.total, correct: r.correct, pct: Math.round((r.correct / r.total) * 100) };
  }
</script>

<div class="quiz">
  <div class="quiz__nav">
    <button class="quiz__back" on:click={() => navigate('/learn/certifications')}>&larr; Certifications</button>
    <Badge variant="level" text={certId.toUpperCase()} />
    {#if quizComplete}
      <Badge variant="success" text="Complete" />
    {/if}
  </div>

  <h1>Knowledge Check — {certId.toUpperCase()}</h1>
  <p class="quiz__meta">30 minutes &middot; {questions.length} questions</p>

  {#if !quizComplete}
    <div class="quiz__timer" class:quiz__timer--warn={timeRemaining < 300}>
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>

    {#if currentQuestion}
      <div class="quiz__progress">
        <div class="quiz__progress-bar">
          <div class="quiz__progress-fill" style="width: {progress_pct}%;"></div>
        </div>
        <span class="quiz__progress-text">Question {currentIndex + 1} of {questions.length}</span>
      </div>

      <Card>
        <div class="quiz__question">
          <p class="quiz__question-text">{currentQuestion.question}</p>
          <div class="quiz__options">
            {#each currentQuestion.options as option, i}
              <button class="quiz__option"
                class:quiz__option--selected={selectedAnswer === i}
                class:quiz__option--correct={answered && i === currentQuestion.correct_index}
                class:quiz__option--wrong={answered && selectedAnswer === i && i !== currentQuestion.correct_index}
                on:click={() => selectAnswer(i)}
                disabled={answered}>
                <span class="quiz__option-letter">{String.fromCharCode(65 + i)}</span>
                <span>{option}</span>
              </button>
            {/each}
          </div>

          {#if answered}
            <div class="quiz__explanation" class:quiz__explanation--correct={selectedAnswer === currentQuestion.correct_index}>
              <strong>{selectedAnswer === currentQuestion.correct_index ? 'Correct!' : 'Incorrect'}</strong>
              <p>{currentQuestion.explanation}</p>
            </div>
          {/if}
        </div>
      </Card>

      <div class="quiz__actions">
        {#if !answered}
          <Button variant="primary" on:click={confirmAnswer} disabled={selectedAnswer < 0}>Confirm Answer</Button>
        {:else}
          <Button variant="primary" on:click={nextQuestion}>
            {currentIndex >= questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
          </Button>
        {/if}
      </div>
    {/if}

  {:else}
    <div class="quiz__results">
      <div class="quiz__score-ring">
        <svg viewBox="0 0 120 120" class="quiz__score-svg">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-bg-primary)" stroke-width="8" />
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-accent-primary)" stroke-width="8"
            stroke-dasharray="326.7" stroke-dashoffset={326.7 - (326.7 * (score / questions.length) * 100 / 100)}
            stroke-linecap="round" transform="rotate(-90 60 60)" />
          <text x="60" y="52" text-anchor="middle" dominant-baseline="central"
            font-size="28" font-weight="700" font-family="var(--font-display)" fill="var(--color-text-primary)">
            {Math.round((score / questions.length) * 100)}%
          </text>
          <text x="60" y="76" text-anchor="middle" dominant-baseline="central"
            font-size="10" font-family="var(--font-display)" fill="var(--color-text-secondary)">
            {score}/{questions.length}
          </text>
        </svg>
      </div>

      <Card variant={score / questions.length >= 0.7 ? 'success' : 'warning'}>
        <h3>Score: {score}/{questions.length} ({Math.round((score / questions.length) * 100)}%)</h3>
        <p>{score / questions.length >= 0.7 ? 'Passed! This contributes to your certification coverage.' : 'Below 70%. Review the domains below and try again.'}</p>
      </Card>

      {#if Object.keys(domainResults).length > 0}
        <Card>
          <h3>Domain Breakdown</h3>
          <div class="quiz__domain-results">
            {#each Object.entries(domainResults) as [domainId, result]}
              <div class="quiz__domain-row">
                <span class="quiz__domain-name">{domainId}</span>
                <span class="quiz__domain-score" class:quiz__domain-score--pass={result.correct / result.total >= 0.7}>
                  {result.correct}/{result.total} correct ({Math.round((result.correct / result.total) * 100)}%)
                </span>
              </div>
            {/each}
          </div>
        </Card>
      {/if}

      <div class="quiz__actions">
        <Button variant="primary" on:click={() => navigate('/learn/certifications')}>Back to Certifications</Button>
        <Button variant="secondary" on:click={() => { currentIndex = 0; selectedAnswer = -1; score = 0; answered = false; quizComplete = false; domainResults = {}; answerHistory = []; timeRemaining = 1800; }}>Retry Quiz</Button>
      </div>
    </div>
  {/if}
</div>

<style>
  .quiz { max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-4); }
  .quiz__nav { display: flex; align-items: center; gap: var(--space-3); }
  .quiz__back { background: none; border: none; color: var(--color-text-secondary); cursor: pointer; font-family: var(--font-body); font-size: var(--text-sm); padding: 0; }
  .quiz__back:hover { color: var(--color-text-primary); }
  .quiz__meta { font-size: var(--text-sm); color: var(--color-text-secondary); }

  .quiz__timer { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 700; text-align: center; color: var(--color-text-primary); padding: var(--space-2); }
  .quiz__timer--warn { color: var(--color-accent-danger); animation: pulse 1s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

  .quiz__progress { display: flex; align-items: center; gap: var(--space-3); }
  .quiz__progress-bar { flex: 1; height: 6px; background: var(--color-bg-primary); border-radius: 3px; overflow: hidden; }
  .quiz__progress-fill { height: 100%; background: var(--color-accent-primary); border-radius: 3px; transition: width 0.3s ease; }
  .quiz__progress-text { font-size: var(--text-xs); color: var(--color-text-secondary); font-family: var(--font-display); }

  .quiz__question-text { font-size: var(--text-base); font-weight: 500; margin-bottom: var(--space-4); line-height: 1.5; }

  .quiz__options { display: flex; flex-direction: column; gap: var(--space-2); }
  .quiz__option { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg-primary); cursor: pointer; text-align: left; font-family: var(--font-body); font-size: var(--text-sm); color: var(--color-text-primary); transition: border-color var(--transition-fast), background var(--transition-fast); }
  .quiz__option:hover:not(:disabled) { border-color: var(--color-text-secondary); }
  .quiz__option--selected { border-color: var(--color-accent-primary); background: rgba(240, 136, 62, 0.08); }
  .quiz__option--correct { border-color: var(--color-accent-success) !important; background: rgba(63, 185, 80, 0.08) !important; }
  .quiz__option--wrong { border-color: var(--color-accent-danger) !important; background: rgba(248, 81, 73, 0.08) !important; }
  .quiz__option-letter { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--color-bg-surface); font-weight: 600; font-size: var(--text-sm); flex-shrink: 0; }
  .quiz__option:disabled { cursor: default; }

  .quiz__explanation { margin-top: var(--space-4); padding: var(--space-3); border-radius: var(--radius-md); background: rgba(63, 185, 80, 0.08); border: 1px solid var(--color-accent-success); }
  .quiz__explanation--correct {}
  .quiz__explanation--correct:not(.quiz__explanation--correct) { border-color: var(--color-accent-danger); background: rgba(248, 81, 73, 0.08); }
  .quiz__explanation strong { display: block; font-size: var(--text-sm); margin-bottom: var(--space-1); }
  .quiz__explanation p { font-size: var(--text-sm); color: var(--color-text-secondary); }

  .quiz__actions { display: flex; gap: var(--space-3); justify-content: flex-end; }

  .quiz__results { display: flex; flex-direction: column; gap: var(--space-6); padding: var(--space-4) 0; }
  .quiz__score-ring { width: 120px; height: 120px; margin: 0 auto; }
  .quiz__score-svg { width: 100%; height: 100%; }

  .quiz__domain-results { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-3); }
  .quiz__domain-row { display: flex; justify-content: space-between; align-items: center; font-size: var(--text-sm); padding: var(--space-2); border-bottom: 1px solid var(--color-border); }
  .quiz__domain-score { font-family: var(--font-display); font-weight: 600; }
  .quiz__domain-score--pass { color: var(--color-accent-success); }
</style>
