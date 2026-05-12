const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

export class BYOKClient {
  constructor() {
    this._key = null;
    this._active = false;
    this._loaded = false;
  }

  loadKey(key) {
    if (!key || typeof key !== 'string') {
      this._key = null;
      this._active = false;
      this._loaded = true;
      return false;
    }

    const trimmed = key.trim();
    if (this._isValidFormat(trimmed)) {
      this._key = trimmed;
      this._active = true;
      this._loaded = true;
      return true;
    }

    this._key = null;
    this._active = false;
    this._loaded = true;
    return false;
  }

  _isValidFormat(key) {
    return /^sk-ant-/.test(key);
  }

  async validateKey(key) {
    const trimmed = (key || '').trim();
    if (!trimmed) {
      return { valid: false, error: 'No key provided' };
    }
    if (!this._isValidFormat(trimmed)) {
      return { valid: false, error: 'Invalid key format — must start with sk-ant-' };
    }

    try {
      const response = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': trimmed,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Reply with a single word: ok' }]
        })
      });

      if (response.ok) {
        return { valid: true, error: null };
      }

      if (response.status === 401) {
        return { valid: false, error: 'Invalid API key — check your key and try again' };
      }
      if (response.status === 429) {
        return { valid: false, error: 'Rate limited — wait a moment and try again' };
      }

      const errText = await response.text().catch(() => 'Unknown error');
      return { valid: false, error: `API error (${response.status}): ${errText.slice(0, 200)}` };
    } catch (err) {
      return { valid: false, error: `Network error: ${err.message || 'Could not reach Anthropic API'}` };
    }
  }

  async sendMessage(messages, systemPrompt, options = {}) {
    if (!this._active || !this._key) return null;

    const body = {
      model: MODEL,
      max_tokens: options.max_tokens || 1000,
      system: systemPrompt || '',
      messages: messages.map(m => ({
        role: m.role || 'user',
        content: m.content || ''
      }))
    };

    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    }

    try {
      const response = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this._key,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        console.error(`BYOK API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.content?.[0]?.text || null;
    } catch (err) {
      console.error('BYOK request failed:', err.message);
      return null;
    }
  }

  async sendPersonaMessage(persona, projectState, userInput) {
    const systemPrompt = (persona.byok_system_prompt || 'You are a stakeholder in an Agile project.')
      + '\n\nCurrent project state:\n' + JSON.stringify(projectState, null, 2)
      + '\n\nRespond in character. Keep responses under 3 sentences.';

    return this.sendMessage(
      [{ role: 'user', content: userInput }],
      systemPrompt,
      { temperature: 0.7 }
    );
  }

  async getBPMNFeedback(bpmnXml, rubricResult, exerciseContext) {
    const prompt = `You are a BPMN coach reviewing a student's process model.

Exercise context: ${exerciseContext}

Rubric result summary:
${JSON.stringify(rubricResult, null, 2)}

The student's BPMN XML:
${bpmnXml.slice(0, 3000)}

Provide specific, actionable coaching feedback on:
1. What the model does well
2. Specific improvements needed
3. How it could better represent the business process
4. Regulatory compliance considerations

Keep feedback to 3-5 sentences.`;

    return this.sendMessage(
      [{ role: 'user', content: prompt }],
      'You are an expert BPMN coach specialising in regulated financial services. Provide concise, actionable feedback.',
      { temperature: 0.3 }
    );
  }

  async getGovernanceFeedback(exerciseId, userSubmission, rubricResult) {
    const prompt = `You are an Agile governance coach reviewing a student's exercise submission.

Exercise: ${exerciseId}

Submission:
${JSON.stringify(userSubmission, null, 2)}

Rubric result:
${JSON.stringify(rubricResult, null, 2)}

Provide brief coaching feedback on what was done well and what could be improved in a regulated Agile context.`;

    return this.sendMessage(
      [{ role: 'user', content: prompt }],
      'You are an expert in regulated Agile delivery for UK financial services and government. Provide concise coaching.',
      { temperature: 0.3 }
    );
  }

  async getSimulationDebrief(decisionLog, finalScore, scenarioId) {
    const prompt = `You are a project management coach reviewing a simulation run.

Scenario: ${scenarioId}

Final score: ${JSON.stringify(finalScore, null, 2)}

Key decisions made:
${JSON.stringify(decisionLog, null, 2)}

Provide a personalised debrief covering:
1. Overall assessment of the decisions made
2. Key learning points for regulated Agile delivery
3. What you would recommend doing differently next time`;

    return this.sendMessage(
      [{ role: 'user', content: prompt }],
      'You are an experienced IT project management coach specialising in regulated environments.',
      { temperature: 0.7 }
    );
  }

  isAvailable() {
    return this._active && !!this._key;
  }

  clearKey() {
    this._key = null;
    this._active = false;
  }
}

let _defaultInstance = null;

export function getDefaultClient() {
  if (!_defaultInstance) {
    _defaultInstance = new BYOKClient();
  }
  return _defaultInstance;
}
