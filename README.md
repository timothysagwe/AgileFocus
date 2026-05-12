```
    ___    _    _  __   __ _   ___   ___  ___   _   ___
   / _ \  /_\  | |/ /  / _` | / __| / __|/ _ \ | | | __|
  | (_) |/ _ \ | ' <  | (_| || (__  \__ \ (_) || | |__ \
   \___//_/ \_\|_|\_\  \__,_| \___| |___/\___/ |_| |___/
```

**Learn IT Project Management and Business Analysis in Agile — built for regulated environments.**

[![GitHub Pages](https://img.shields.io/badge/hosted-GitHub%20Pages-blue?logo=github)](https://timothysagwe.github.io/AgileFocus)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Contributions Welcome](https://img.shields.io/badge/PRs-welcome-amber)](CONTRIBUTING.md)

---

## What Is This?

AgileFocus is a **free, open-source learning sandbox** for IT Project Management and Business Analysis in Agile environments subject to regulation. It focuses on UK financial services (FCA, PRA, PCI-DSS) and government digital (GDS Service Standard).

- **No account needed.** No sign-up, no email, no subscription.
- **Works in any browser.** Fully client-side — nothing leaves your machine.
- **Offline capable.** Once loaded, the sandbox works without a network connection.
- **BYOK AI.** Optionally bring your own Anthropic API key for AI-powered persona conversations. No mandatory API keys.
- **Built by a practitioner, for practitioners.** No vendor content, no certification body affiliation.

---

## Who Is It For?

- **Early-career IT Project Managers and Business Analysts** entering UK financial services or government digital.
- **Practitioners studying for certifications** — PSM I / PSM II, PMI-ACP, AgilePM (DSDM), BCS Business Analysis Diploma, GDS Service Standard.
- **Anyone who wants to practise regulated Agile** without a classroom or a tutor.

---

## What You Can Learn

| Module | Description |
|--------|-------------|
| **BPMN Process Modelling** | 3 interactive exercises across Tiers 1-3 (comprehension, modelling, audit). More coming. |
| **Agile Simulation** | Meridian Bank fraud alert triage — 6 sprints, 3 stakeholders, regulatory deadlines. |
| **Regulated Agile Governance** | 6 modules covering CAB, DoD, traceability, release management, evidence packs, DORA. |
| **Stakeholder Personas** | 8 pre-built personas (Product Owner, Risk Manager, Internal Auditor, FCA Supervisor, GDS Assessor, etc.) plus a persona builder to create your own. |
| **Certification Tracking** | Coverage mapped to PSM I, PMI-ACP, AgilePM, BCS BA Diploma, and GDS Standard. 100 knowledge-check questions. |
| **Stakeholder Conversations** | Chat with personas in character. Logic-layer mode included; AI mode available with your own API key. |

---

## Getting Started

**[Visit the Sandbox →](https://timothysagwe.github.io/AgileFocus)**

1. No account needed — start learning immediately.
2. Progress saves automatically in your browser (localStorage).
3. Start with **BPMN Tier 1** (comprehension) or **Simulation 1** (Meridian Bank).
4. Optional: Add your Anthropic API key in **Settings** to unlock AI-powered persona conversations.

---

## Running Locally

```bash
git clone https://github.com/timothysagwe/AgileFocus.git
cd agilefocus
npm install
npm run dev
```

Opens at `http://localhost:5173`.

### Other Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest tests |
| `npm run validate-schemas` | Validate all data files against schemas |
| `npm run test:coverage` | Run tests with coverage report |

---

## Contributing

**You don't need to write code to contribute.** Content contributions (scenarios, personas, BPMN exercises) only require editing a JSON file.

Three contribution types:

- **Content** — New scenarios, personas, or BPMN exercises (no code, just JSON).
- **Code** — Bug fixes, features, UI improvements.
- **Documentation** — Corrections, improvements, new explanations.

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for full details.

---

## Technology

| Component | Technology | License |
|-----------|-----------|---------|
| Framework | [Svelte 4](https://svelte.dev) | MIT |
| Bundler | [Vite](https://vitejs.dev) | MIT |
| BPMN | [bpmn-js](https://bpmn.io) | bpmn-js license |
| Charts | [Chart.js](https://www.chartjs.org) | MIT |
| Styling | Vanilla CSS with design tokens | — |
| Fonts | IBM Plex Mono, IBM Plex Sans | OFL-1.1 |
| Schema Validation | [AJV](https://ajv.js.org) | MIT |
| Testing | [Vitest](https://vitest.dev) | MIT |
| Hosting | GitHub Pages | — |
| Backend | **None** — fully client-side | — |

---

## License

MIT. See [LICENSE](LICENSE).

*AgileFocus is not affiliated with the Scrum Guide, PMI, DSDM Consortium, BCS, or GDS. Certification names are trademarks of their respective owners. This is a learning tool, not an official certification preparation course.*
