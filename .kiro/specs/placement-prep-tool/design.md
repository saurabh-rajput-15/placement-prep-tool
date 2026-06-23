# Design Document — Placement Prep Tool

## Overview

The Placement Prep Tool is a frontend-only, offline-first single-page web application (SPA). It runs entirely in the browser with no backend, no build step, and no external runtime dependencies. All state is held in memory and mirrored to `localStorage` on every mutation. The application is structured around a lightweight MVC-like pattern: a central **Store** owns the data model and exposes read/write methods; **View** modules own DOM rendering; and **Controllers** wire user events to Store operations and trigger re-renders.

### Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Vanilla JS (ES6 modules) | No build toolchain required; loads offline; matches the zero-dependency, file-only deployment goal |
| State management | Single in-memory object + localStorage mirror | Simplest approach that satisfies offline-first persistence |
| Routing / navigation | Hash-based (location.hash) | Works from `file://` and any static host without server-side routing |
| Styling | Plain CSS with CSS custom properties | No preprocessor required; easily themed |
| Module system | ES6 `import/export` via `<script type="module">` | Native browser support; no bundler needed |

---

## Architecture

The application follows a unidirectional data flow:

```
User Action
    │
    ▼
Controller
    │  calls
    ▼
Store.update(patch)
    │  writes
    ▼
localStorage
    │  triggers
    ▼
ScoreEngine.compute(store)
    │  feeds
    ▼
RecommendationEngine / CompanySimulator
    │
    ▼
View.render(state)
    │
    ▼
DOM
```

### Module Map

```
src/
├── index.html           # Single HTML shell; all JS loaded as modules
├── styles/
│   └── main.css         # Layout, component styles, CSS variables
└── js/
    ├── main.js          # Entry point: boots app, registers hash router
    ├── store.js         # Central state store + localStorage persistence
    ├── scoreEngine.js   # Pure score computation functions
    ├── recommendationEngine.js  # Pure recommendation logic
    ├── companySimulator.js      # Company profiles + gap analysis
    ├── router.js        # Hash-based view router
    ├── views/
    │   ├── dashboard.js
    │   ├── dsaTracker.js
    │   ├── projectsTracker.js
    │   ├── csTracker.js
    │   ├── aptitudeTracker.js
    │   ├── resumeTracker.js
    │   └── companySimulatorView.js
    └── utils/
        ├── validation.js   # Input validation helpers
        └── dom.js          # Lightweight DOM helpers (createElement, render)
```

### Rendering Cycle

Every time the Store is mutated, a single `app.render()` call re-renders only the currently visible view. This avoids full-page repaints while keeping the implementation simple:

```
store.commit(patch)
  → localStorage.setItem(NAMESPACE, JSON.stringify(state))
  → app.renderCurrentView()
```

---

## Components and Interfaces

### Store (`store.js`)

The Store is a singleton that holds the complete application state and provides typed mutator methods.

```js
// Public API
Store.getState()                     // → AppState (deep clone)
Store.commit(partialState)           // merges patch, saves to localStorage, fires render
Store.loadFromStorage()              // called once on boot
Store.clearAll()                     // resets to defaults, clears localStorage
```

**Persistence contract**: `commit()` always calls `localStorage.setItem(NAMESPACE, JSON.stringify(newState))` synchronously. Because all user interactions are triggered by DOM events (not animation frames), the write happens within the same event-loop tick as the user action — well within the 500 ms requirement.

### Score Engine (`scoreEngine.js`)

A collection of **pure functions** with no side effects or DOM access.

```js
computeDSAScore(entries)       // → number 0–100
computeProjectsScore(entries)  // → number 0–100
computeCSScore(entries)        // → number 0–100
computeAptitudeScore(entries)  // → number 0–100
computeResumeScore(resume)     // → number 0–100
computeFinalScore(scores)      // → number 0–100
computeReadinessBand(score)    // → "Beginner"|"Moderate"|"Strong"|"Interview Ready"
computeAllScores(state)        // → ScoreResult — convenience wrapper
```

All functions are deterministic and referentially transparent, making them straightforward to test with property-based tests.

### Recommendation Engine (`recommendationEngine.js`)

A pure function that takes a `ScoreResult` and returns an array of recommendation strings.

```js
getRecommendations(scores)  // → string[]
```

Threshold constants are defined at module level:

```js
const THRESHOLDS = {
  dsa: 60, projects: 60, cs: 70, aptitude: 50, resume: 100
};
```

### Company Simulator (`companySimulator.js`)

Company profiles are static data objects. Gap analysis is a pure function.

```js
COMPANY_PROFILES  // Record<CompanyName, CompanyProfile>

computeCompanyReadiness(state, companyName)
// → { readinessPercent: number, gaps: Gap[], suggestions: string[] }
```

**Company profile schema:**
```js
{
  name: string,
  minDSASolved: number,
  minProjects: number,
  minCGPA: number,
  requiredCSSubjects: string[],
  minAptitudeSolved: number,
  weights: Record<Metric, number>   // for readiness % computation
}
```

### Router (`router.js`)

Hash-based routing maps `#dashboard`, `#dsa`, `#projects`, `#cs`, `#aptitude`, `#resume`, `#company` to view render functions.

```js
Router.register(hash, renderFn)
Router.navigate(hash)
Router.init()   // attaches hashchange listener, renders initial view
```

### Views (`views/*.js`)

Each view module exports a single `render(state, scores)` function that returns a DOM node. The app shell replaces the `<main id="view-root">` content with the returned node on each navigation or state change.

```js
// Pattern used by every view module
export function render(state, scores) {
  const root = document.createElement('section');
  // ... build DOM imperatively or via template literals
  return root;
}
```

Form submissions within views dispatch actions through the Controller layer, which calls `Store.commit()`.

---

## Data Models

### AppState

```ts
interface AppState {
  dsaEntries:       DSAEntry[];
  projectEntries:   ProjectEntry[];
  csEntries:        CSEntry[];
  aptitudeEntries:  AptitudeEntry[];
  resume:           ResumeData;
  cgpa:             number | null;      // 0.0–10.0 or null if not entered
  selectedCompany:  CompanyName | null;
}
```

### DSAEntry

```ts
interface DSAEntry {
  id:           string;   // crypto.randomUUID() or Date.now().toString()
  topic:        string;   // non-empty
  solved:       number;   // non-negative integer
  difficulty:   "Easy" | "Medium" | "Hard";
  createdAt:    number;   // Unix ms
}
```

### ProjectEntry

```ts
interface ProjectEntry {
  id:          string;
  name:        string;   // non-empty
  difficulty:  "Basic" | "Intermediate" | "High Level";
  githubLink:  string;   // URL or ""
  liveLink:    string;   // URL or ""
  techStack:   string;
  status:      "Planned" | "In Progress" | "Completed";
  createdAt:   number;
}
```

### CSEntry

```ts
interface CSEntry {
  id:       string;
  subject:  string;   // non-empty, e.g. "DBMS", "OS"
  topic:    string;   // non-empty
  status:   "not-started" | "in-progress" | "completed";
}
```

### AptitudeEntry

```ts
interface AptitudeEntry {
  id:        string;
  type:      "Quantitative" | "Logical" | "Verbal";
  difficulty: "Easy" | "Medium" | "Hard";
  solved:    number;          // non-negative integer
  accuracy:  number | null;   // 0–100 or null
}
```

### ResumeData

```ts
interface ResumeData {
  linkedIn:         string;
  github:           string;
  portfolio:        string;
  topProjectLevel:  "Basic" | "Intermediate" | "High Level" | "";
  achievements:     string;
  activities:       string;
}
```

### ScoreResult

```ts
interface ScoreResult {
  dsa:      number;   // 0–100
  projects: number;
  cs:       number;
  aptitude: number;
  resume:   number;
  final:    number;   // weighted aggregate, 0–100
  band:     "Beginner" | "Moderate" | "Strong" | "Interview Ready";
}
```

### LocalStorage Layout

Everything is stored under a single key to avoid key collision and simplify atomic writes:

```
localStorage["placementPrepTool_v1"] = JSON.stringify(AppState)
```

On load, the app reads this key, validates basic structure, and falls back to `DEFAULT_STATE` if parsing fails.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

> **Property Reflection Summary**: After reviewing all testable acceptance criteria, several redundancies were eliminated. The four band-label criteria (1.3–1.6) are merged into one total-function property. The five persistence round-trip criteria (2.2, 2.4, 3.2, 3.5, 4.2, 4.4, 5.2, 5.4, 6.2) are merged into one localStorage round-trip property on `AppState`. The whitespace-rejection criteria (2.6, 3.7, 4.7) are merged into one validator property. The five recommendation-threshold criteria (8.1–8.5) are merged into one comprehensive property. Gap non-emptiness (9.4) and suggestions-per-gap (9.5) are merged into one gap analysis property.

---

### Property 1: DSA Score is bounded and monotone

*For any* list of DSA entries, `computeDSAScore(entries)` SHALL return a value in the range [0, 100]. Adding a new entry with `solved > 0` to any existing list SHALL NOT decrease the returned score.

**Validates: Requirements 2.5, 7.2, 7.4**

---

### Property 2: Projects Score is bounded and monotone

*For any* list of project entries, `computeProjectsScore(entries)` SHALL return a value in the range [0, 100]. Adding a new project entry to any existing list SHALL NOT decrease the returned score.

**Validates: Requirements 3.6, 7.2, 7.4**

---

### Property 3: CS Score is bounded, zero on empty, and monotone

*For any* list of CS entries (including the empty list), `computeCSScore(entries)` SHALL return a value in the range [0, 100]. When the list is empty, the score SHALL be exactly 0. Changing any entry's status to "completed" in any list SHALL NOT decrease the score.

**Validates: Requirements 4.5, 4.6, 7.2, 7.4**

---

### Property 4: Aptitude Score is bounded and monotone

*For any* list of aptitude entries, `computeAptitudeScore(entries)` SHALL return a value in the range [0, 100]. Adding an entry with `solved > 0` to any existing list SHALL NOT decrease the returned score.

**Validates: Requirements 5.5, 7.2, 7.4**

---

### Property 5: Resume Score matches non-empty field count

*For any* `ResumeData` object, `computeResumeScore(resume)` SHALL equal `completedSections / 6 × 100` where `completedSections` is the count of non-empty string fields among the six tracked fields (LinkedIn, GitHub, Portfolio, project level, achievements, activities), and the result SHALL be in [0, 100].

**Validates: Requirements 6.3, 7.2, 7.4**

---

### Property 6: Final Score formula is correct and bounded

*For any* five individual scores each in the range [0, 100], `computeFinalScore(scores)` SHALL return exactly `dsa×0.35 + projects×0.25 + cs×0.20 + aptitude×0.10 + resume×0.10`, and the result SHALL be in [0, 100].

**Validates: Requirements 7.1, 7.2, 7.4**

---

### Property 7: Readiness band is a total function over [0, 100]

*For any* final score value in [0, 100], `computeReadinessBand(score)` SHALL return exactly one of "Beginner" (0–39), "Moderate" (40–59), "Strong" (60–79), or "Interview Ready" (80–100), and SHALL never return `undefined`, `null`, or any other string.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 8: Whitespace-only text inputs are always rejected

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), the shared text validation function SHALL return a non-empty error message and the Store SHALL NOT be mutated when that string is submitted as a topic name, project name, CS subject name, or CS topic name.

**Validates: Requirements 2.6, 3.7, 4.7**

---

### Property 9: Out-of-range numeric inputs are always rejected

*For any* integer less than 0, the "solved questions" validator (used by DSA and Aptitude trackers) SHALL reject the value. *For any* number strictly outside [0, 100], the Aptitude accuracy validator SHALL reject it. *For any* number strictly outside [0.0, 10.0], the CGPA validator SHALL reject it. In all rejection cases the Store SHALL remain unchanged.

**Validates: Requirements 2.6, 5.6, 9.8**

---

### Property 10: Recommendations match threshold violations

*For any* `ScoreResult`, `getRecommendations(scores)` SHALL include the recommendation string for module X if and only if X's score is below its threshold (DSA < 60, Projects < 60, CS < 70, Aptitude < 50, Resume < 100). Calling the function twice with identical input SHALL return equal arrays.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**

---

### Property 11: LocalStorage round-trip preserves AppState

*For any* `AppState` object, serialising it via `JSON.stringify` and immediately deserialising via `JSON.parse` SHALL produce a value that is structurally and semantically equivalent to the original — all entry arrays, IDs, numeric fields, and string fields are preserved exactly.

**Validates: Requirements 10.1, 10.2, 10.3**

---

### Property 12: Company readiness percentage is bounded and gaps are covered

*For any* `AppState` and any valid `CompanyName` in {"Google", "Amazon", "TCS", "Infosys"}, `computeCompanyReadiness` SHALL return a `readinessPercent` in [0, 100]. Additionally, for every gap object in the returned `gaps` array, there SHALL be at least one corresponding entry in the `suggestions` array.

**Validates: Requirements 9.3, 9.4, 9.5**

---

## Error Handling

### Validation Errors (User Input)

All validation is performed synchronously in the Controller layer before any Store mutation. Errors are rendered inline adjacent to the offending field. Validation rules:

| Field | Rule |
|---|---|
| DSA topic | non-empty after trim |
| DSA solved | integer ≥ 0 |
| Project name | non-empty after trim |
| CS subject / topic | non-empty after trim |
| Aptitude solved | integer ≥ 0 |
| Aptitude accuracy | number in [0, 100] or empty |
| Resume URLs | warn (not block) if not starting with `http://` or `https://` |
| CGPA | decimal in [0.0, 10.0] |

Validation errors do NOT save the entry and do NOT clear the form, so the user can correct the input.

### LocalStorage Unavailability

On `Store.loadFromStorage()` and every `Store.commit()`, the code wraps `localStorage` access in a `try/catch`. If the first write attempt fails (e.g., in private-browsing mode with storage blocked), the Store sets an `storageUnavailable` flag and the shell renders a persistent banner:

> ⚠ Your browser has blocked local storage. Data will not be saved after you close this tab.

The app continues to function fully in-memory for the session.

### Corrupted / Stale Data

If `JSON.parse` of the stored value throws or the parsed object is missing expected top-level keys, the Store silently falls back to `DEFAULT_STATE`. No error is shown to the user unless explicitly useful.

### Hash Routing Fallback

If the URL hash does not match any registered route, the Router defaults to `#dashboard`.

---

## Testing Strategy

### Overview

Because the Score Engine, Recommendation Engine, Company Simulator, and validation utilities are all **pure functions**, they are ideal candidates for property-based testing. The View layer (DOM manipulation) is tested with example-based unit tests.

### Property-Based Testing

**Library:** [fast-check](https://github.com/dubzzz/fast-check) (JavaScript)

**Configuration:** Minimum **100 runs** per property test.

Each test is tagged with a comment in the format:
```js
// Feature: placement-prep-tool, Property N: <property_text>
```

Properties to implement as PBT tests (from Correctness Properties above):

| Property | Module under test | Generator inputs |
|---|---|---|
| 1 — DSA Score bounded & monotone | `scoreEngine.computeDSAScore` | `fc.array(fc.record({ solved: fc.nat(), topic: fc.string(), difficulty: fc.constantFrom("Easy","Medium","Hard") }))` |
| 2 — Projects Score bounded & monotone | `scoreEngine.computeProjectsScore` | `fc.array(fc.record({ name: fc.string() }))` |
| 3 — CS Score bounded, zero on empty, monotone | `scoreEngine.computeCSScore` | `fc.array(fc.record({ status: fc.constantFrom("not-started","in-progress","completed") }))` — includes empty array |
| 4 — Aptitude Score bounded & monotone | `scoreEngine.computeAptitudeScore` | `fc.array(fc.record({ solved: fc.nat() }))` |
| 5 — Resume Score matches non-empty fields | `scoreEngine.computeResumeScore` | `fc.record({ linkedIn: fc.string(), github: fc.string(), portfolio: fc.string(), topProjectLevel: fc.string(), achievements: fc.string(), activities: fc.string() })` |
| 6 — Final Score formula & bounded | `scoreEngine.computeFinalScore` | `fc.record({ dsa: fc.float({min:0,max:100}), projects: fc.float({min:0,max:100}), cs: fc.float({min:0,max:100}), aptitude: fc.float({min:0,max:100}), resume: fc.float({min:0,max:100}) })` |
| 7 — Band is total function | `scoreEngine.computeReadinessBand` | `fc.float({min:0,max:100})` |
| 8 — Whitespace text inputs rejected | `validation.validateText` | `fc.stringMatching(/^\s+$/)` |
| 9 — Out-of-range numerics rejected | `validation.validateNonNegInt`, `validation.validateAccuracy`, `validation.validateCGPA` | `fc.integer({max:-1})`, `fc.float` outside [0,100], `fc.float` outside [0,10] |
| 10 — Recommendations match violations | `recommendationEngine.getRecommendations` | `fc.record` with each score independently varied above/below its threshold |
| 11 — localStorage round-trip | `Store.commit` + `Store.loadFromStorage` | Full `AppState` generator covering all entry types |
| 12 — Company readiness bounded & gaps covered | `companySimulator.computeCompanyReadiness` | `AppState` generator × `fc.constantFrom("Google","Amazon","TCS","Infosys")` |

### Example-Based Unit Tests

- Each tracker view: submitting a valid form updates the Store correctly
- Each tracker view: submitting an invalid form shows an error and leaves the Store unchanged
- Dashboard: correct band label for boundary scores (0, 39, 40, 59, 60, 79, 80, 100)
- Company Simulator: selecting each of the four companies renders the correct profile thresholds
- Router: unknown hash defaults to dashboard

### Integration / Smoke Tests

- Application boot with empty localStorage → Dashboard shown, all scores 0
- Application boot with pre-populated localStorage → scores and entries correctly restored
- LocalStorage unavailable → warning banner displayed, app remains functional

### Test Runner

**Vitest** is recommended (zero-config, ES-module native). Run with `vitest --run` for a single pass (no watch mode).

```
npm install --save-dev vitest fast-check
npx vitest --run
```
