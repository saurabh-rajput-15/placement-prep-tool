# Implementation Plan: Placement Prep Tool

## Overview

Implement a frontend-only, offline-first SPA using vanilla JavaScript ES6 modules. The app tracks placement preparation across five pillars (DSA, Projects, CS Subjects, Aptitude, Resume), computes a weighted readiness score, provides recommendations, and simulates company-specific gap analysis. All state is persisted to `localStorage` under a single namespace key. No build step is required — the app loads directly from `file://`.

## Tasks

- [x] 1. Project scaffold and HTML shell
  - [x] 1.1 Create the `src/` directory structure and `index.html`
    - Create `src/index.html` with the full HTML shell: `<nav>` for navigation links (Dashboard, DSA, Projects, CS, Aptitude, Resume, Company Simulator), `<main id="view-root">` as the render target, and `<script type="module" src="js/main.js">` as the sole script tag
    - Add a `<div id="storage-banner" hidden>` element for the localStorage-unavailable warning
    - Create `src/styles/main.css` with CSS custom properties for colours and spacing, base layout (nav + main), component styles for cards, forms, tables, and the readiness-band badge
    - Create empty placeholder files for every JS module listed in the module map so imports resolve: `js/main.js`, `js/store.js`, `js/scoreEngine.js`, `js/recommendationEngine.js`, `js/companySimulator.js`, `js/router.js`, `js/views/dashboard.js`, `js/views/dsaTracker.js`, `js/views/projectsTracker.js`, `js/views/csTracker.js`, `js/views/aptitudeTracker.js`, `js/views/resumeTracker.js`, `js/views/companySimulatorView.js`, `js/utils/validation.js`, `js/utils/dom.js`
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 2. Utility modules — DOM helpers and validation
  - [x] 2.1 Implement `js/utils/dom.js`
    - Export `createElement(tag, attrs, ...children)` that creates and returns a DOM element with given attributes and children
    - Export `clearElement(el)` that removes all child nodes from an element
    - Export `setAttr(el, attrs)` for bulk attribute setting
    - _Requirements: 11.2_

  - [x] 2.2 Implement `js/utils/validation.js`
    - Export `validateText(value)` → `{ valid: boolean, error: string }` — rejects empty string and whitespace-only strings, returns a non-empty error message for invalid input
    - Export `validateNonNegInt(value)` → `{ valid: boolean, error: string }` — rejects any value that is not a non-negative integer (< 0 rejects)
    - Export `validateAccuracy(value)` → `{ valid: boolean, error: string }` — accepts empty string (optional field) or a number in [0, 100]; rejects anything outside that range
    - Export `validateCGPA(value)` → `{ valid: boolean, error: string }` — rejects values outside [0.0, 10.0]
    - Export `warnURL(value)` → `{ warn: boolean, message: string }` — returns a warning (not an error) when the value is non-empty and does not start with `http://` or `https://`
    - _Requirements: 2.6, 3.7, 4.7, 5.6, 6.5, 9.8_

  - [x] 2.3 Write property tests for validation utilities
    - **Property 8: Whitespace-only text inputs are always rejected**
    - **Validates: Requirements 2.6, 3.7, 4.7**
    - **Property 9: Out-of-range numeric inputs are always rejected**
    - **Validates: Requirements 2.6, 5.6, 9.8**
    - Use `fc.stringMatching(/^\s+$/)` for Property 8; use `fc.integer({max:-1})` and out-of-range floats for Property 9
    - Place tests in `tests/validation.test.js`

- [x] 3. Central Store with localStorage persistence
  - [x] 3.1 Implement `js/store.js`
    - Define `DEFAULT_STATE` covering all `AppState` fields: `dsaEntries: []`, `projectEntries: []`, `csEntries: []`, `aptitudeEntries: []`, `resume: { linkedIn:'', github:'', portfolio:'', topProjectLevel:'', achievements:'', activities:'' }`, `cgpa: null`, `selectedCompany: null`
    - Export `Store.loadFromStorage()` — reads `localStorage["placementPrepTool_v1"]`, validates top-level keys, falls back to `DEFAULT_STATE` on parse error or missing keys; wraps in `try/catch` and sets `storageUnavailable` flag if localStorage is blocked
    - Export `Store.getState()` — returns a deep clone of the current in-memory state
    - Export `Store.commit(partialState)` — merges the patch into current state, calls `JSON.stringify` and writes to `localStorage["placementPrepTool_v1"]` synchronously, then calls `app.renderCurrentView()`
    - Export `Store.clearAll()` — resets state to `DEFAULT_STATE` and clears the localStorage key
    - Expose `Store.storageUnavailable` boolean for the shell to read
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 3.2 Write property test for localStorage round-trip
    - **Property 11: LocalStorage round-trip preserves AppState**
    - **Validates: Requirements 10.1, 10.2, 10.3**
    - Build a full `AppState` arbitrary using `fc.record` covering all entry arrays and scalar fields
    - Assert `JSON.parse(JSON.stringify(state))` is deeply equal to the original state for all fields
    - Place test in `tests/store.test.js`

- [x] 4. Score Engine — pure score computation
  - [x] 4.1 Implement all score functions in `js/scoreEngine.js`
    - `computeDSAScore(entries)` → `Math.min(sum(entries.map(e=>e.solved)) / 100 * 100, 100)`
    - `computeProjectsScore(entries)` → `Math.min(entries.length / 5 * 100, 100)`
    - `computeCSScore(entries)` → `entries.length === 0 ? 0 : entries.filter(e=>e.status==='completed').length / entries.length * 100`
    - `computeAptitudeScore(entries)` → `Math.min(sum(entries.map(e=>e.solved)) / 200 * 100, 100)`
    - `computeResumeScore(resume)` → counts non-empty fields among the six tracked fields and returns `count / 6 * 100`
    - `computeFinalScore(scores)` → `scores.dsa*0.35 + scores.projects*0.25 + scores.cs*0.20 + scores.aptitude*0.10 + scores.resume*0.10`
    - `computeReadinessBand(score)` → returns `"Beginner"` (0–39), `"Moderate"` (40–59), `"Strong"` (60–79), `"Interview Ready"` (80–100)
    - `computeAllScores(state)` → calls each function and returns a `ScoreResult` object
    - All functions are pure with no DOM access or side effects
    - _Requirements: 2.5, 3.6, 4.5, 4.6, 5.5, 6.3, 7.1, 7.2, 7.3, 7.4_

  - [x] 4.2 Write property test for DSA Score (Property 1)
    - **Property 1: DSA Score is bounded and monotone**
    - **Validates: Requirements 2.5, 7.2, 7.4**
    - Generator: `fc.array(fc.record({ solved: fc.nat(), topic: fc.string(), difficulty: fc.constantFrom('Easy','Medium','Hard') }))`
    - Place test in `tests/scoreEngine.test.js`

  - [x] 4.3 Write property test for Projects Score (Property 2)
    - **Property 2: Projects Score is bounded and monotone**
    - **Validates: Requirements 3.6, 7.2, 7.4**
    - Generator: `fc.array(fc.record({ name: fc.string() }))`
    - Place test in `tests/scoreEngine.test.js`

  - [x] 4.4 Write property test for CS Score (Property 3)
    - **Property 3: CS Score is bounded, zero on empty, and monotone**
    - **Validates: Requirements 4.5, 4.6, 7.2, 7.4**
    - Generator: `fc.array(fc.record({ status: fc.constantFrom('not-started','in-progress','completed') }))` — must include the empty array case
    - Place test in `tests/scoreEngine.test.js`

  - [x] 4.5 Write property test for Aptitude Score (Property 4)
    - **Property 4: Aptitude Score is bounded and monotone**
    - **Validates: Requirements 5.5, 7.2, 7.4**
    - Generator: `fc.array(fc.record({ solved: fc.nat() }))`
    - Place test in `tests/scoreEngine.test.js`

  - [x] 4.6 Write property test for Resume Score (Property 5)
    - **Property 5: Resume Score matches non-empty field count**
    - **Validates: Requirements 6.3, 7.2, 7.4**
    - Generator: `fc.record({ linkedIn: fc.string(), github: fc.string(), portfolio: fc.string(), topProjectLevel: fc.string(), achievements: fc.string(), activities: fc.string() })`
    - Place test in `tests/scoreEngine.test.js`

  - [x] 4.7 Write property test for Final Score formula (Property 6)
    - **Property 6: Final Score formula is correct and bounded**
    - **Validates: Requirements 7.1, 7.2, 7.4**
    - Generator: `fc.record({ dsa: fc.float({min:0,max:100}), projects: fc.float({min:0,max:100}), cs: fc.float({min:0,max:100}), aptitude: fc.float({min:0,max:100}), resume: fc.float({min:0,max:100}) })`
    - Assert exact formula `dsa*0.35+projects*0.25+cs*0.20+aptitude*0.10+resume*0.10` within floating-point tolerance
    - Place test in `tests/scoreEngine.test.js`

  - [x] 4.8 Write property test for readiness band (Property 7)
    - **Property 7: Readiness band is a total function over [0, 100]**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**
    - Generator: `fc.float({min:0, max:100})`
    - Assert result is one of the four valid strings and is never `undefined`, `null`, or an unexpected value
    - Place test in `tests/scoreEngine.test.js`

- [x] 5. Checkpoint — Score Engine and validation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Recommendation Engine
  - [x] 6.1 Implement `js/recommendationEngine.js`
    - Define `THRESHOLDS = { dsa: 60, projects: 60, cs: 70, aptitude: 50, resume: 100 }`
    - Export `getRecommendations(scores)` → `string[]`
    - Add the corresponding recommendation string for each module whose score is below its threshold
    - When all thresholds are met, return `["Great job! Your profile is well-rounded. Focus on mock interviews."]`
    - Function is pure — same input always produces same output
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 6.2 Write property test for Recommendation Engine (Property 10)
    - **Property 10: Recommendations match threshold violations**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**
    - Use `fc.record` with each score independently varied above and below its threshold using `fc.float({min:0,max:100})`
    - Assert the presence/absence of each recommendation string matches the threshold condition; assert idempotence (two calls with same input produce equal arrays)
    - Place test in `tests/recommendationEngine.test.js`

- [x] 7. Company Simulator
  - [x] 7.1 Implement `js/companySimulator.js` — company profiles and gap analysis
    - Define `COMPANY_PROFILES` as a static `Record<CompanyName, CompanyProfile>` object for all four companies: Google, Amazon, TCS, Infosys — each with `minDSASolved`, `minProjects`, `minCGPA`, `requiredCSSubjects[]`, `minAptitudeSolved`, and `weights`
    - Export `computeCompanyReadiness(state, companyName)` → `{ readinessPercent: number, gaps: Gap[], suggestions: string[] }` — `readinessPercent` must be in [0, 100]; for every gap object there must be at least one entry in `suggestions`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 7.2 Write property test for Company Simulator (Property 12)
    - **Property 12: Company readiness percentage is bounded and gaps are covered**
    - **Validates: Requirements 9.3, 9.4, 9.5**
    - Generator: full `AppState` arbitrary × `fc.constantFrom('Google','Amazon','TCS','Infosys')`
    - Assert `readinessPercent` ∈ [0, 100] and every gap has ≥ 1 corresponding suggestion
    - Place test in `tests/companySimulator.test.js`

- [x] 8. Hash-based Router
  - [x] 8.1 Implement `js/router.js`
    - Export `Router` object with `register(hash, renderFn)`, `navigate(hash)`, and `init()` methods
    - `init()` attaches a `hashchange` event listener on `window` and renders the view matching the current `location.hash`
    - If `location.hash` does not match any registered route, default to `#dashboard`
    - `navigate(hash)` sets `location.hash` and triggers the render cycle
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 9. Application entry point
  - [x] 9.1 Implement `js/main.js` — boot sequence and wiring
    - Call `Store.loadFromStorage()` on module load
    - Show `#storage-banner` if `Store.storageUnavailable` is true
    - Register all seven routes in the Router: `#dashboard`, `#dsa`, `#projects`, `#cs`, `#aptitude`, `#resume`, `#company`
    - Each route's render function calls `computeAllScores(Store.getState())` and passes `state` and `scores` to the corresponding view's `render()` function, then replaces `<main id="view-root">` content with the returned node
    - Export `app.renderCurrentView()` so `Store.commit()` can call it after each mutation
    - Highlight the active nav link by toggling an `active` CSS class on each `<a>` based on the current hash
    - Call `Router.init()` at the end of boot
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 10.4_

- [x] 10. Dashboard view
  - [x] 10.1 Implement `js/views/dashboard.js`
    - Export `render(state, scores)` that returns a `<section>` DOM node
    - Display Final Readiness Score as a percentage rounded to one decimal place
    - Display the Readiness Band label with appropriate visual styling
    - Display each of the five module scores as individual percentage values
    - Display all recommendations returned by `getRecommendations(scores)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 11. DSA Tracker view
  - [x] 11.1 Implement `js/views/dsaTracker.js`
    - Export `render(state, scores)` that returns a `<section>` DOM node
    - Render a form with fields: topic (text input), solved (number input), difficulty (select: Easy / Medium / Hard)
    - On form submit: validate using `validateText(topic)` and `validateNonNegInt(solved)`, show inline error messages on failure, do NOT mutate Store on failure
    - On valid submit: call `Store.commit({ dsaEntries: [...state.dsaEntries, newEntry] })` where `newEntry` includes a generated `id` (`crypto.randomUUID()` or `Date.now().toString()`) and `createdAt: Date.now()`
    - Render the existing entries as a table or list with a Delete button per row
    - Delete button calls `Store.commit({ dsaEntries: state.dsaEntries.filter(e => e.id !== id) })`
    - Display the current DSA Score
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

- [x] 12. Projects Tracker view
  - [x] 12.1 Implement `js/views/projectsTracker.js`
    - Export `render(state, scores)` returning a `<section>` DOM node
    - Render an add-project form with fields: name (text), difficulty (select: Basic / Intermediate / High Level), GitHub link (text), live link (text), tech stack (text), status (select: Planned / In Progress / Completed)
    - On submit: validate `name` with `validateText`; show inline error on failure; on success call `Store.commit` with the new entry appended
    - Render existing entries with Edit and Delete buttons
    - Edit button opens an inline edit form pre-populated with the entry's current values; on save, merge the updated entry back into `projectEntries` and call `Store.commit`
    - Delete button removes the entry and calls `Store.commit`
    - Warn (do not block) if GitHub or live link does not start with `http://` or `https://` using `warnURL`
    - Display the current Projects Score
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 13. CS Subjects Tracker view
  - [x] 13.1 Implement `js/views/csTracker.js`
    - Export `render(state, scores)` returning a `<section>` DOM node
    - Render a form with fields: subject (text), topic (text), status (select: not-started / in-progress / completed)
    - On submit: validate both subject and topic with `validateText`; show inline errors on failure; on success append the new entry to `csEntries` via `Store.commit`
    - Render existing entries as a table with an inline status-change dropdown and a Delete button
    - Status dropdown `change` event updates the matching entry's status and calls `Store.commit`
    - Delete button removes the entry and calls `Store.commit`
    - Display the current CS Score; show "0" when `csEntries` is empty
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 14. Aptitude Tracker view
  - [x] 14.1 Implement `js/views/aptitudeTracker.js`
    - Export `render(state, scores)` returning a `<section>` DOM node
    - Render a form with fields: type (select: Quantitative / Logical / Verbal), difficulty (select: Easy / Medium / Hard), solved (number), accuracy (number, optional)
    - On submit: validate `solved` with `validateNonNegInt` and (if non-empty) accuracy with `validateAccuracy`; show inline errors; on success append new entry via `Store.commit`
    - Render existing entries as a table with a Delete button per row
    - Delete button removes the entry and calls `Store.commit`
    - Display the current Aptitude Score
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 15. Resume Tracker view
  - [x] 15.1 Implement `js/views/resumeTracker.js`
    - Export `render(state, scores)` returning a `<section>` DOM node
    - Render a single form with fields matching `ResumeData`: LinkedIn URL, GitHub URL, Portfolio URL, highest project level (select with empty option), achievements (textarea), activities (textarea)
    - Pre-populate all fields from `state.resume`
    - On save: call `warnURL` for each URL field and display inline warnings (do not block save); call `Store.commit({ resume: updatedResume })`
    - Display the current Resume Score as a percentage
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 16. Company Simulator view
  - [x] 16.1 Implement `js/views/companySimulatorView.js`
    - Export `render(state, scores)` returning a `<section>` DOM node
    - Render a company-select dropdown (Google, Amazon, TCS, Infosys) pre-selected to `state.selectedCompany`
    - Render a CGPA input field pre-populated from `state.cgpa`; validate on change with `validateCGPA`; show inline error and do NOT commit invalid CGPA; on valid input, call `Store.commit({ cgpa: parsedValue })`
    - When a company is selected, call `Store.commit({ selectedCompany: name })` then call `computeCompanyReadiness(state, name)` and render: company thresholds table, readiness percentage, gaps list, suggestions list
    - When a different company is selected, update the view reactively (triggered by the store commit → re-render cycle)
    - Display "Select a company to begin gap analysis" when `selectedCompany` is null
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [x] 17. Checkpoint — all views render and navigation works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Test infrastructure setup
  - [x] 18.1 Set up Vitest and fast-check
    - Create `package.json` in the project root (or `src/`) with `"type": "module"` and dev-dependencies `vitest` and `fast-check` at pinned versions
    - Create `vitest.config.js` (or use the default config) to target `tests/**/*.test.js`
    - Create a `tests/` directory with index files for each test suite: `tests/validation.test.js`, `tests/scoreEngine.test.js`, `tests/recommendationEngine.test.js`, `tests/companySimulator.test.js`, `tests/store.test.js`
    - Verify `npx vitest --run` executes without import errors on empty test files
    - _Requirements: (testing infrastructure only)_

- [x] 19. Write all property-based tests (full implementation)
  - [x] 19.1 Implement property tests in `tests/scoreEngine.test.js`
    - Properties 1–7 as described in tasks 4.2–4.8
    - Each test tagged with `// Feature: placement-prep-tool, Property N: <property_text>`
    - Minimum 100 runs per property (fast-check default)
    - _Requirements: 2.5, 3.6, 4.5, 4.6, 5.5, 6.3, 7.1, 7.2, 7.4, 1.3, 1.4, 1.5, 1.6_

  - [x] 19.2 Implement property tests in `tests/validation.test.js`
    - Properties 8–9 as described in task 2.3
    - _Requirements: 2.6, 3.7, 4.7, 5.6, 9.8_

  - [x] 19.3 Implement property test in `tests/recommendationEngine.test.js`
    - Property 10 as described in task 6.2
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 19.4 Implement property test in `tests/store.test.js`
    - Property 11 as described in task 3.2
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 19.5 Implement property test in `tests/companySimulator.test.js`
    - Property 12 as described in task 7.2
    - _Requirements: 9.3, 9.4, 9.5_

- [x] 20. Example-based unit tests
  - [x] 20.1 Write unit tests for tracker views and router
    - DSA Tracker: valid form submission updates Store; invalid form shows error without mutating Store
    - Projects Tracker: valid submission adds entry; empty name shows error
    - CS Tracker: valid submission adds entry; status change updates entry; empty fields show errors
    - Aptitude Tracker: valid submission adds entry; negative solved rejects; out-of-range accuracy rejects
    - Resume Tracker: save persists all six fields; URL warnings appear without blocking save
    - Dashboard: correct band label at boundary scores (0, 39, 40, 59, 60, 79, 80, 100)
    - Company Simulator: selecting each of the four companies renders the correct thresholds; invalid CGPA shows error
    - Router: unknown hash defaults to `#dashboard`
    - Place tests in `tests/views.test.js` and `tests/router.test.js`
    - _Requirements: 1.3–1.6, 2.6, 3.7, 4.7, 5.6, 6.5, 9.8, 11.1–11.4_

  - [x] 20.2 Write integration / smoke tests
    - Boot with empty localStorage → Dashboard shown, all scores 0
    - Boot with pre-populated localStorage → scores and entries correctly restored
    - localStorage unavailable → warning banner displayed, app remains functional in-memory
    - Place tests in `tests/integration.test.js`
    - _Requirements: 10.1, 10.2, 10.4, 11.4_

- [x] 21. Final checkpoint — all tests pass and app is fully wired
  - Run `npx vitest --run` and confirm all property-based tests, unit tests, and integration tests pass.
  - Open `src/index.html` directly from `file://` and verify all seven navigation routes load without errors and localStorage persistence works across page reloads.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all 12 correctness properties still provide high confidence when run
- Each task references specific requirements for traceability
- The app requires NO build step — open `src/index.html` from `file://` or any static file server
- For testing, run: `npm install --save-dev vitest fast-check` then `npx vitest --run`
- Fast-check runs each property with a minimum of 100 random inputs by default
- All property tests must be tagged: `// Feature: placement-prep-tool, Property N: <property_text>`
- The Store's `commit()` always writes synchronously within the same event-loop tick, satisfying the 500 ms persistence requirement (Req 10.3)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "18.1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "3.1"] },
    { "id": 3, "tasks": ["3.2", "4.1", "8.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "6.1", "7.1", "9.1"] },
    { "id": 5, "tasks": ["6.2", "7.2", "10.1", "11.1", "12.1", "13.1", "14.1", "15.1", "16.1"] },
    { "id": 6, "tasks": ["19.1", "19.2", "19.3", "19.4", "19.5"] },
    { "id": 7, "tasks": ["20.1", "20.2"] }
  ]
}
```
