// Feature: placement-prep-tool, Property 11: LocalStorage round-trip preserves AppState
// Store property-based tests
// Property 11 — implemented in task 3.2 / 19.4

import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Arbitraries for each entry type (matching the AppState data models)
// ---------------------------------------------------------------------------

const dsaEntryArb = fc.record({
  id: fc.string({ minLength: 1 }),
  topic: fc.string({ minLength: 1 }),
  solved: fc.nat(),
  difficulty: fc.constantFrom('Easy', 'Medium', 'Hard'),
  createdAt: fc.nat(),
});

const projectEntryArb = fc.record({
  id: fc.string({ minLength: 1 }),
  name: fc.string({ minLength: 1 }),
  difficulty: fc.constantFrom('Basic', 'Intermediate', 'High Level'),
  githubLink: fc.string(),
  liveLink: fc.string(),
  techStack: fc.string(),
  status: fc.constantFrom('Planned', 'In Progress', 'Completed'),
  createdAt: fc.nat(),
});

const csEntryArb = fc.record({
  id: fc.string({ minLength: 1 }),
  subject: fc.string({ minLength: 1 }),
  topic: fc.string({ minLength: 1 }),
  status: fc.constantFrom('not-started', 'in-progress', 'completed'),
});

const aptitudeEntryArb = fc.record({
  id: fc.string({ minLength: 1 }),
  type: fc.constantFrom('Quantitative', 'Logical', 'Verbal'),
  difficulty: fc.constantFrom('Easy', 'Medium', 'Hard'),
  solved: fc.nat(),
  accuracy: fc.oneof(fc.float({ min: 0, max: 100, noNaN: true }), fc.constant(null)),
});

const resumeDataArb = fc.record({
  linkedIn: fc.string(),
  github: fc.string(),
  portfolio: fc.string(),
  topProjectLevel: fc.constantFrom('Basic', 'Intermediate', 'High Level', ''),
  achievements: fc.string(),
  activities: fc.string(),
});

const appStateArb = fc.record({
  dsaEntries: fc.array(dsaEntryArb),
  projectEntries: fc.array(projectEntryArb),
  csEntries: fc.array(csEntryArb),
  aptitudeEntries: fc.array(aptitudeEntryArb),
  resume: resumeDataArb,
  cgpa: fc.oneof(fc.float({ min: 0, max: 10, noNaN: true }), fc.constant(null)),
  selectedCompany: fc.oneof(
    fc.constantFrom('Google', 'Amazon', 'TCS', 'Infosys'),
    fc.constant(null)
  ),
});

// ---------------------------------------------------------------------------
// Property 11: LocalStorage round-trip preserves AppState
// ---------------------------------------------------------------------------

describe('store', () => {
  describe('Property 11: LocalStorage round-trip preserves AppState', () => {
    // Validates: Requirements 10.1, 10.2, 10.3

    it('JSON.parse(JSON.stringify(state)) deep-equals the original state for any AppState', () => {
      fc.assert(
        fc.property(appStateArb, (state) => {
          const serialised = JSON.stringify(state);
          const deserialised = JSON.parse(serialised);

          // All entry arrays must be preserved exactly
          expect(deserialised.dsaEntries).toEqual(state.dsaEntries);
          expect(deserialised.projectEntries).toEqual(state.projectEntries);
          expect(deserialised.csEntries).toEqual(state.csEntries);
          expect(deserialised.aptitudeEntries).toEqual(state.aptitudeEntries);

          // Resume object must be preserved exactly
          expect(deserialised.resume).toEqual(state.resume);

          // Scalar fields must be preserved exactly
          expect(deserialised.cgpa).toEqual(state.cgpa);
          expect(deserialised.selectedCompany).toEqual(state.selectedCompany);

          // Full structural equality as a final check
          expect(deserialised).toEqual(state);
        }),
        { numRuns: 100 }
      );
    });

    it('all DSAEntry fields (id, topic, solved, difficulty, createdAt) survive round-trip', () => {
      fc.assert(
        fc.property(fc.array(dsaEntryArb, { minLength: 1 }), (entries) => {
          const state = { dsaEntries: entries };
          const roundTripped = JSON.parse(JSON.stringify(state));
          expect(roundTripped.dsaEntries).toHaveLength(entries.length);
          entries.forEach((entry, i) => {
            expect(roundTripped.dsaEntries[i]).toEqual(entry);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('all ProjectEntry fields survive round-trip', () => {
      fc.assert(
        fc.property(fc.array(projectEntryArb, { minLength: 1 }), (entries) => {
          const state = { projectEntries: entries };
          const roundTripped = JSON.parse(JSON.stringify(state));
          expect(roundTripped.projectEntries).toHaveLength(entries.length);
          entries.forEach((entry, i) => {
            expect(roundTripped.projectEntries[i]).toEqual(entry);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('all CSEntry fields survive round-trip', () => {
      fc.assert(
        fc.property(fc.array(csEntryArb, { minLength: 1 }), (entries) => {
          const state = { csEntries: entries };
          const roundTripped = JSON.parse(JSON.stringify(state));
          expect(roundTripped.csEntries).toHaveLength(entries.length);
          entries.forEach((entry, i) => {
            expect(roundTripped.csEntries[i]).toEqual(entry);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('all AptitudeEntry fields survive round-trip', () => {
      fc.assert(
        fc.property(fc.array(aptitudeEntryArb, { minLength: 1 }), (entries) => {
          const state = { aptitudeEntries: entries };
          const roundTripped = JSON.parse(JSON.stringify(state));
          expect(roundTripped.aptitudeEntries).toHaveLength(entries.length);
          entries.forEach((entry, i) => {
            expect(roundTripped.aptitudeEntries[i]).toEqual(entry);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('ResumeData fields survive round-trip', () => {
      fc.assert(
        fc.property(resumeDataArb, (resume) => {
          const state = { resume };
          const roundTripped = JSON.parse(JSON.stringify(state));
          expect(roundTripped.resume).toEqual(resume);
        }),
        { numRuns: 100 }
      );
    });

    it('cgpa null or in [0.0, 10.0] survives round-trip', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.float({ min: 0, max: 10, noNaN: true }), fc.constant(null)),
          (cgpa) => {
            const state = { cgpa };
            const roundTripped = JSON.parse(JSON.stringify(state));
            expect(roundTripped.cgpa).toEqual(cgpa);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('selectedCompany null or one of the four companies survives round-trip', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constantFrom('Google', 'Amazon', 'TCS', 'Infosys'),
            fc.constant(null)
          ),
          (selectedCompany) => {
            const state = { selectedCompany };
            const roundTripped = JSON.parse(JSON.stringify(state));
            expect(roundTripped.selectedCompany).toEqual(selectedCompany);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
