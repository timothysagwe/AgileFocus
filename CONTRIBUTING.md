# Contributing to AgileFocus

**No code experience needed for content contributions.** If you work in UK financial services, government digital, or any regulated environment, you already have the domain knowledge this project needs.

The sandbox improves when practitioners share their real-world scenarios, stakeholder personas, and process challenges. A well-written scenario pack can teach someone more than a textbook chapter.

---

## Three Ways to Contribute

### Content Contributions (No Code Required)

Add new **scenario packs**, **personas**, or **BPMN exercises** by editing JSON files. The schema validation pipeline checks your structure automatically when you open a pull request. You only need to edit a single JSON file.

### Code Contributions

Bug fixes, new features, and UI improvements. Open an issue first to discuss significant changes. See the [Code Contribution Guide](#code-contribution-guide).

### Documentation Contributions

Corrections, improvements, or new explanations. Open a pull request against `CONTRIBUTING.md`, `README.md`, or any topic page in `src/routes/learn/`.

---

## Content Contribution Guide

All content lives in `src/data/` organised by type:

```
src/data/
  scenarios/       # Simulation scenario packs
  personas/        # Stakeholder personas
  bpmn-exercises/  # BPMN modelling exercises
  schemas/         # JSON validation schemas
```

---

### Contributing a Scenario Pack

**What makes a good scenario:**

- A realistic regulated environment (e.g., challenger bank implementing PCI-DSS controls, a government digital service building a citizen-facing system, an insurer meeting FCA Consumer Duty requirements).
- Genuine stakeholder tensions — conflicting priorities between delivery speed, regulatory compliance, and audit readiness.
- Educational injected events — regulatory finding, CAB rejection, audit finding, change freeze, budget cut.
- Clear debrief notes that explain what the scenario teaches and what a good BA should have done differently.

**File location and naming convention:**

```
src/data/scenarios/{organisation}-{project}.json
```

Use kebab-case. The `id` field in the JSON must match the filename without `.json`.

**Example — minimal 3-sprint scenario:**

```json
{
  "id": "example-bank-onboarding",
  "title": "Example Bank — Digital Onboarding",
  "level_required": 2,
  "context": {
    "organisation": {
      "name": "Example Bank",
      "type": "challenger_bank",
      "regulator": "FCA",
      "pci_dss_scope": true
    },
    "regulatory_context": "FCA Consumer Duty requires timely and clear onboarding. PCI-DSS applies to identity verification.",
    "team_composition": {
      "developers": 4,
      "qa": 1,
      "ba": 1,
      "product_owner": 1
    }
  },
  "personas_active": ["product-owner-challenger", "risk-manager-tier1"],
  "sprints": [
    {
      "sprint_number": 1,
      "goal": "Establish onboarding flow foundations",
      "duration_days": 10,
      "initial_backlog": [
        { "id": "id-verify", "title": "Identity verification step", "points": 8, "type": "regulatory" },
        { "id": "kyc-check", "title": "KYC document upload", "points": 5, "type": "regulatory" },
        { "id": "progress-bar", "title": "Application progress indicator", "points": 3, "type": "business" },
        { "id": "save-draft", "title": "Save application as draft", "points": 5, "type": "business" },
        { "id": "email-notify", "title": "Email notification on submission", "points": 3, "type": "business" }
      ],
      "injected_events": [],
      "available_decisions": []
    }
  ],
  "success_criteria": [
    { "id": "regulatory-stories", "description": "All regulatory stories delivered", "weight": 3.0 },
    { "id": "audit-readiness", "description": "Evidence pack ready for audit", "weight": 2.0 }
  ],
  "debrief_notes": {
    "product-owner-challenger": "Frustrated by compliance overhead. Needs convincing that KYC cannot be skipped.",
    "risk-manager-tier1": "Satisfied with identity verification controls. Concerned about timeline."
  }
}
```

**Step by step:**

1. Fork the repository.
2. Create your scenario file at `src/data/scenarios/{your-id}.json`.
3. Validate locally: `npm run validate-schemas -- --files src/data/scenarios/{your-id}.json`
4. Update `src/data/scenarios/index.json` to include your scenario ID.
5. Open a pull request.

**Validation checklist:**

- [ ] JSON validates against `schemas/scenario.schema.json`
- [ ] Minimum 3 sprints, each with at least 1 backlog item
- [ ] At least 2 personas active
- [ ] `level_required` between 1-4
- [ ] All personas referenced exist in `src/data/personas/`
- [ ] ⚠️ Debrief notes explain what the scenario teaches

**Review criteria:**

- Regulatory accuracy — are the compliance requirements realistic for the context?
- Plausibility — would a real project face these tensions?
- Educational value — does the scenario teach a transferable skill?
- No PII, no real organisation names, no real regulatory cases.

> **Do not use real bank names, real government departments, or real regulatory enforcement cases.** Fictional organisations only.

---

### Contributing a Persona

**What makes a good persona:**

- A specific agenda that is distinct from their official role. A Product Owner who wants speed is obvious. A Product Owner who genuinely believes compliance can be deferred to production is more interesting.
- A realistic knowledge boundary — what does this person systematically misunderstand? The boundary is the hardest thing to get right. A good boundary is believable and creates productive tension with other personas.
- Specific trigger conditions grounded in real project dynamics (budget variance, regulatory pressure, deadline proximity, team velocity).

**The knowledge boundary:**

| Good | Bad |
|------|-----|
| "Misunderstands that compliance cannot be retrofitted — believes audit findings can be addressed after go-live" | "Doesn't understand technology" |
| "Believes Agile means there is no documentation" | "Is difficult to work with" |
| "Thinks CAB approval is a rubber stamp and does not require evidence" | "Doesn't like Agile" |

**File location and naming convention:**

```
src/data/personas/{role}-{organisation-type}.json
```

**Example — minimal persona:**

```json
{
  "id": "compliance-officer-example",
  "name": "Amara Singh",
  "role": "Compliance Officer",
  "organisation_type": "challenger_bank",
  "agenda": "Ensure every story has documented evidence of regulatory compliance before it reaches production. The team's velocity is not my concern.",
  "communication_style": "regulatory_precise",
  "knowledge_boundary": {
    "misunderstands": "Believes Agile teams can produce full traceability documentation in real time, as if every task generates its own audit report automatically.",
    "triggers_on": "Any suggestion that documentation can be created 'after the sprint ends'"
  },
  "trust_score_initial": 45,
  "triggers": [
    {
      "condition": "regulatory_pressure == elevated",
      "response_key": "compliance_concern",
      "trust_delta": -10
    },
    {
      "condition": "evidence_pack_status == none",
      "response_key": "missing_evidence",
      "trust_delta": -15,
      "cascade_state_change": { "regulatory_pressure": "elevated" }
    }
  ],
  "conflict_with": ["product-owner"],
  "responses": {
    "compliance_concern": "I need to see the evidence pack for the regulatory stories this sprint. Verbal assurances are not sufficient.",
    "missing_evidence": "There is no evidence pack. We cannot proceed to CAB review without one. This is a blocker.",
    "fallback": "My concern is compliance, not convenience. Please document your controls."
  },
  "byok_system_prompt": "You are Amara Singh, a Compliance Officer at a challenger bank. You are meticulous, process-driven, and insistent on documented evidence. You do not accept verbal hand-waving. You reference specific regulatory obligations (FCA, PCI-DSS) in your responses."
}
```

**Validation checklist:**

- [ ] JSON validates against `schemas/persona.schema.json`
- [ ] `id` uses kebab-case
- [ ] `organisation_type` is one of the enum values in the schema
- [ ] `communication_style` is one of the enum values
- [ ] At least 1 trigger and at most 10 triggers
- [ ] At least 2 response keys (including `fallback`)
- [ ] `trust_delta` between -30 and +30
- [ ] `byok_system_prompt` is at least 10 characters

**Review criteria:**

- Specificity to FS or government context
- Agenda distinct from the persona's job title
- Trigger realism — would this situation actually arise in a regulated project?

---

### Contributing a BPMN Exercise

**What makes a good exercise:**

- A process that is recognisable to financial services or government practitioners (e.g., mortgage application, change request, CAB submission, payment exception handling).
- A rubric that tests understanding, not memorisation. Questions should require the learner to apply regulatory knowledge to a process model.
- Feedback messages that explain *why* something is wrong, not just that it is wrong.

**Creating the model answer BPMN file:**

1. Open [bpmn.io](https://bpmn.io) in your browser (free, no account needed).
2. Model the correct process.
3. Download as XML — save to `src/data/bpmn-exercises/models/{exercise-id}.bpmn`.
4. Reference the filename in the exercise JSON's `model_answer_file` field.

**File location and naming convention:**

```
src/data/bpmn-exercises/tier{number}-{topic}.json
src/data/bpmn-exercises/models/tier{number}-{topic}-answer.bpmn
```

**Example — exercise JSON structure:**

```json
{
  "id": "tier2-example-cab-submission",
  "title": "CAB Submission Workflow",
  "tier": 2,
  "level_required": 2,
  "context": "Model the Change Advisory Board submission process. Changes must be reviewed by IT, Risk, and CAB before production deployment.",
  "instructions": "Create a BPMN diagram with lanes for IT, Risk, and CAB. Include approval gateways, error handling on the review subprocess, and audit tasks.",
  "model_answer_file": "models/tier2-example-cab-submission-answer.bpmn",
  "rubric": {
    "required_elements": [
      { "type": "bpmn:Lane", "minimum_count": 3, "points": 3, "description": "At least 3 lanes" },
      { "type": "bpmn:ExclusiveGateway", "minimum_count": 2, "points": 4, "description": "Approval gateways" }
    ],
    "required_patterns": [
      { "pattern_id": "has_error_handling", "points": 4, "description": "Error boundary on review subprocess", "check_function": "has_error_handling" },
      { "pattern_id": "has_audit_trail", "points": 3, "description": "Audit-relevant task", "check_function": "has_audit_trail" }
    ],
    "forbidden_antipatterns": [
      { "pattern_id": "disconnected_elements", "penalty": 5, "description": "No orphaned elements", "check_function": "disconnected_elements" },
      { "pattern_id": "no_default_gateway_path", "penalty": 3, "description": "Default path on all gateways", "check_function": "no_default_gateway_path" }
    ],
    "partial_credit_rules": [
      { "condition": "any_element_present", "points": 2, "feedback": "Some elements present" }
    ],
    "feedback_messages": {
      "pass": "Your model meets all requirements.",
      "fail": "Review the regulatory requirements for error handling and approvals.",
      "partial": "Good start. Focus on missing elements."
    },
    "max_points": 21
  }
}
```

**Rubric writing guide:**

- **Required elements** — BPMN element types the model must contain (lanes, gateways, tasks, subprocesses). Set realistic minimum counts.
- **Required patterns** — Structural checks (error handling, audit trails, default paths, complete flow).
- **Forbidden antipatterns** — Things that should not appear (disconnected elements, missing default paths). Use penalties, not points.
- **Partial credit rules** — Reward partial attempts. Keep conditions simple (e.g., "any_element_present", "score_above_zero").
- **Feedback messages** — Explain *why* the model passes or fails, not just the score.

**Validation checklist:**

- [ ] JSON validates against `schemas/bpmn-exercise.schema.json`
- [ ] `tier` between 1-5
- [ ] Rubric has at least 1 required element
- [ ] Rubric has at least 2 forbidden antipatterns
- [ ] Feedback messages include `pass` and `fail` keys
- [ ] Model answer .bpmn file exists in `models/` and is referenced in `model_answer_file`
- [ ] Update `src/data/bpmn-exercises/index.json` to include the new exercise ID

**Review criteria:**

- BPMN accuracy — is the rubric realistically testable?
- Process relevance — is this a process a regulated sector BA would actually model?
- Rubric educational value — does the feedback teach something?

---

## Code Contribution Guide

### Setup

```bash
git clone https://github.com/{your-username}/agilefocus.git
cd agilefocus
npm install
npm run dev    # localhost:5173
```

### Coding Standards

- **CSS** — Vanilla CSS only. No CSS frameworks. Use design tokens from `src/styles/tokens.css` (`var(--color-*)`, `var(--space-*)`, `var(--text-*)`, `var(--radius-*)`).
- **Dependencies** — No new npm dependencies without discussion in an issue first. The project must remain lightweight and offline-capable.
- **Components** — Svelte 4 components in `src/lib/components/`.
- **Engines** — Pure JavaScript modules in `src/lib/engines/`. No framework dependencies.
- **Tests** — Vitest tests required for all engine code. Place tests in `src/lib/engines/*.test.js`.
- **Routing** — Client-side SPA router from `src/lib/router.js`. Do not add a router library.

### PR Process

- **New features** — Open an issue first to discuss design and scope.
- **Bug fixes** — Direct pull request is fine. Include steps to reproduce.
- **All PRs** — Must pass `npm run validate-schemas`, `npm run test`, and `npm run build`.

---

## Community Standards

- **Be specific, be accurate, be educational.** Every scenario should teach a real skill.
- **No self-promotion or employer promotion.** Do not reference your company, product, or service.
- **Fictional scenarios only.** Never use real organisation names, real regulatory enforcement cases, or real incidents. Create fictional banks, fictional government departments, and fictional regulatory findings.
- **No personally identifiable information.** All persona names must be fictional.
- **Respect the regulatory context.** Do not trivialise compliance requirements. The sandbox teaches regulated Agile — bad practices should be presented as bad practices, not endorsed.
