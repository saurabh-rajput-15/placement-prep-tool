// Feature: placement-prep-tool, Property 12: Company readiness percentage is bounded and gaps are covered
// Company Simulator property-based tests
// Property 12 — implemented in task 7.2 / 19.5

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { computeCompanyReadiness } from '../src/js/companySimulator.js';

// ── AppState arbitrary ────────────────────────────────────────────────────

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
  selectedCompany: fc.oneof(fc.constantFrom('Google', 'Amazon', 'TCS', 'Infosys'), fc.constant(null)),
});

const companyArb = fc.constantFrom('Google', 'Amazon', 'TCS', 'Infosys');

// ── Property 12 ───────────────────────────────────────────────────────────

describe('companySimulator', () => {
  it('Property 12: readinessPercent is bounded in [0, 100] for any AppState and company', () => {
    // Feature: placement-prep-tool, Property 12: Company readiness percentage is bounded and gaps are covered
    // Validates: Requirements 9.3, 9.4, 9.5
    fc.assert(
      fc.property(appStateArb, companyArb, (state, company) => {
        const result = computeCompanyReadiness(state, company);
        expect(result.readinessPercent).toBeGreaterThanOrEqual(0);
        expect(result.readinessPercent).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });

  it('Property 12: every gap has at least one corresponding suggestion', () => {
    // Feature: placement-prep-tool, Property 12: Company readiness percentage is bounded and gaps are covered
    // Validates: Requirements 9.4, 9.5
    fc.assert(
      fc.property(appStateArb, companyArb, (state, company) => {
        const result = computeCompanyReadiness(state, company);
        // Each gap should have at least one suggestion (suggestions[i] for gaps[i])
        result.gaps.forEach((gap, i) => {
          expect(result.suggestions[i]).toBeDefined();
          expect(typeof result.suggestions[i]).toBe('string');
          expect(result.suggestions[i].length).toBeGreaterThan(0);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('Property 12: result always has readinessPercent, gaps array, and suggestions array', () => {
    fc.assert(
      fc.property(appStateArb, companyArb, (state, company) => {
        const result = computeCompanyReadiness(state, company);
        expect(typeof result.readinessPercent).toBe('number');
        expect(Array.isArray(result.gaps)).toBe(true);
        expect(Array.isArray(result.suggestions)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
