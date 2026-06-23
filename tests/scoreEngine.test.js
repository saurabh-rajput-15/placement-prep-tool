// Feature: placement-prep-tool
// Score Engine property-based tests
// Properties 1–7 — implemented in tasks 4.2–4.8 / 19.1

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { computeDSAScore, computeCSScore, computeProjectsScore, computeReadinessBand, computeResumeScore, computeAptitudeScore, computeFinalScore } from '../src/js/scoreEngine.js';

describe('scoreEngine', () => {
  // Property 1: DSA Score is bounded and monotone
  // Feature: placement-prep-tool, Property 1: DSA Score is bounded and monotone
  // Validates: Requirements 2.5, 7.2, 7.4
  describe('Property 1: DSA Score is bounded and monotone', () => {
    const entryArb = fc.array(
      fc.record({
        solved: fc.nat(),
        topic: fc.string(),
        difficulty: fc.constantFrom('Easy', 'Medium', 'Hard'),
      })
    );

    it('returns a value in [0, 100] for any input', () => {
      fc.assert(
        fc.property(entryArb, (entries) => {
          const score = computeDSAScore(entries);
          return score >= 0 && score <= 100;
        }),
        { numRuns: 100 }
      );
    });

    it('adding an entry with solved > 0 does NOT decrease the score (monotone)', () => {
      fc.assert(
        fc.property(
          entryArb,
          fc.record({
            solved: fc.nat({ max: 10000 }).filter((n) => n > 0),
            topic: fc.string(),
            difficulty: fc.constantFrom('Easy', 'Medium', 'Hard'),
          }),
          (entries, newEntry) => {
            const scoreBefore = computeDSAScore(entries);
            const scoreAfter = computeDSAScore([...entries, newEntry]);
            return scoreAfter >= scoreBefore;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Property 3: CS Score is bounded, zero on empty, and monotone
  // Feature: placement-prep-tool, Property 3: CS Score is bounded, zero on empty, and monotone
  // Validates: Requirements 4.5, 4.6, 7.2, 7.4
  describe('Property 3: CS Score is bounded, zero on empty, and monotone', () => {
    const statusArb = fc.constantFrom('not-started', 'in-progress', 'completed');
    const entriesArb = fc.array(fc.record({ status: statusArb }));

    it('returns a value in [0, 100] for any input', () => {
      fc.assert(
        fc.property(entriesArb, (entries) => {
          const score = computeCSScore(entries);
          return score >= 0 && score <= 100;
        }),
        { numRuns: 100 }
      );
    });

    it('returns exactly 0 for an empty array', () => {
      expect(computeCSScore([])).toBe(0);
    });

    it('changing any entry status to "completed" does NOT decrease the score (monotone)', () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({ status: statusArb }), { minLength: 1 }).filter(
            (entries) => entries.some((e) => e.status !== 'completed')
          ),
          fc.nat(),
          (entries, indexSeed) => {
            const nonCompletedIndices = entries
              .map((e, i) => (e.status !== 'completed' ? i : -1))
              .filter((i) => i !== -1);
            const idx = nonCompletedIndices[indexSeed % nonCompletedIndices.length];

            const before = computeCSScore(entries);
            const modified = entries.map((e, i) =>
              i === idx ? { ...e, status: 'completed' } : e
            );
            const after = computeCSScore(modified);

            return after >= before;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  // Feature: placement-prep-tool, Property 2: Projects Score is bounded and monotone
  // Validates: Requirements 3.6, 7.2, 7.4
  describe('Property 2: Projects Score is bounded and monotone', () => {
    const projectEntryArb = fc.array(fc.record({ name: fc.string() }));

    it('returns a value in [0, 100] for any array of project entries', () => {
      fc.assert(
        fc.property(projectEntryArb, (entries) => {
          const score = computeProjectsScore(entries);
          return score >= 0 && score <= 100;
        }),
        { numRuns: 100 }
      );
    });

    it('adding a new project entry does NOT decrease the score (monotone)', () => {
      fc.assert(
        fc.property(
          projectEntryArb,
          fc.record({ name: fc.string() }),
          (entries, newEntry) => {
            const scoreBefore = computeProjectsScore(entries);
            const scoreAfter = computeProjectsScore([...entries, newEntry]);
            return scoreAfter >= scoreBefore;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  // Property 7: Readiness band is a total function over [0, 100]
  // Feature: placement-prep-tool, Property 7: Readiness band is a total function over [0, 100]
  // Validates: Requirements 1.3, 1.4, 1.5, 1.6
  describe('Property 7: Readiness band is a total function over [0, 100]', () => {
    const VALID_BANDS = ['Beginner', 'Moderate', 'Strong', 'Interview Ready'];

    it('returns one of the four valid band strings for any score in [0, 100]', () => {
      fc.assert(
        fc.property(fc.float({ min: 0, max: 100, noNaN: true }), (score) => {
          const band = computeReadinessBand(score);
          return VALID_BANDS.includes(band);
        }),
        { numRuns: 100 }
      );
    });

    it('never returns undefined, null, or an unexpected value for any score in [0, 100]', () => {
      fc.assert(
        fc.property(fc.float({ min: 0, max: 100, noNaN: true }), (score) => {
          const band = computeReadinessBand(score);
          return band !== undefined && band !== null && typeof band === 'string' && VALID_BANDS.includes(band);
        }),
        { numRuns: 100 }
      );
    });

    it('returns "Beginner" for scores in [0, 39)', () => {
      fc.assert(
        fc.property(fc.float({ min: 0, max: 39, noNaN: true }).filter((s) => s < 40), (score) => {
          return computeReadinessBand(score) === 'Beginner';
        }),
        { numRuns: 100 }
      );
    });

    it('returns "Moderate" for scores in [40, 59]', () => {
      fc.assert(
        fc.property(fc.float({ min: 40, max: 59, noNaN: true }).filter((s) => s < 60), (score) => {
          return computeReadinessBand(score) === 'Moderate';
        }),
        { numRuns: 100 }
      );
    });

    it('returns "Strong" for scores in [60, 79]', () => {
      fc.assert(
        fc.property(fc.float({ min: 60, max: 79, noNaN: true }).filter((s) => s < 80), (score) => {
          return computeReadinessBand(score) === 'Strong';
        }),
        { numRuns: 100 }
      );
    });

    it('returns "Interview Ready" for scores in [80, 100]', () => {
      fc.assert(
        fc.property(fc.float({ min: 80, max: 100, noNaN: true }), (score) => {
          return computeReadinessBand(score) === 'Interview Ready';
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: placement-prep-tool, Property 4: Aptitude Score is bounded and monotone
  // Validates: Requirements 5.5, 7.2, 7.4
  describe('Property 4: Aptitude Score is bounded and monotone', () => {
    const aptitudeEntryArb = fc.array(fc.record({ solved: fc.nat() }));

    it('returns a value in [0, 100] for any input', () => {
      fc.assert(
        fc.property(aptitudeEntryArb, (entries) => {
          const score = computeAptitudeScore(entries);
          return score >= 0 && score <= 100;
        }),
        { numRuns: 100 }
      );
    });

    it('adding an entry with solved > 0 does NOT decrease the score (monotone)', () => {
      fc.assert(
        fc.property(
          aptitudeEntryArb,
          fc.record({ solved: fc.nat().filter((n) => n > 0) }),
          (entries, newEntry) => {
            const scoreBefore = computeAptitudeScore(entries);
            const scoreAfter = computeAptitudeScore([...entries, newEntry]);
            return scoreAfter >= scoreBefore;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: placement-prep-tool, Property 6: Final Score formula is correct and bounded
  // Validates: Requirements 7.1, 7.2, 7.4
  describe('Property 6: Final Score formula is correct and bounded', () => {
    // Generator: all five component scores as floats in [0, 100]
    const scoresArb = fc.record({
      dsa: fc.float({ min: 0, max: 100, noNaN: true }),
      projects: fc.float({ min: 0, max: 100, noNaN: true }),
      cs: fc.float({ min: 0, max: 100, noNaN: true }),
      aptitude: fc.float({ min: 0, max: 100, noNaN: true }),
      resume: fc.float({ min: 0, max: 100, noNaN: true }),
    });

    it('computes exact weighted formula within floating-point tolerance', () => {
      // Property 6: Final Score formula is correct and bounded
      fc.assert(
        fc.property(scoresArb, ({ dsa, projects, cs, aptitude, resume }) => {
          const expected = dsa * 0.35 + projects * 0.25 + cs * 0.20 + aptitude * 0.10 + resume * 0.10;
          const actual = computeFinalScore({ dsa, projects, cs, aptitude, resume });
          return Math.abs(actual - expected) < 0.0001;
        }),
        { numRuns: 100 }
      );
    });

    it('returns a value in [0, 100] for any component scores in [0, 100]', () => {
      fc.assert(
        fc.property(scoresArb, ({ dsa, projects, cs, aptitude, resume }) => {
          const score = computeFinalScore({ dsa, projects, cs, aptitude, resume });
          return score >= 0 && score <= 100;
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: placement-prep-tool, Property 5: Resume Score matches non-empty field count
  // Validates: Requirements 6.3, 7.2, 7.4
  describe('Property 5: Resume Score matches non-empty field count', () => {
    // Generator: all six tracked resume fields as arbitrary strings (including empty)
    const resumeArb = fc.record({
      linkedIn: fc.string(),
      github: fc.string(),
      portfolio: fc.string(),
      topProjectLevel: fc.string(),
      achievements: fc.string(),
      activities: fc.string(),
    });

    it('equals nonEmptyFieldCount / 6 * 100 for any resume object', () => {
      fc.assert(
        fc.property(resumeArb, (resume) => {
          const fields = [
            resume.linkedIn,
            resume.github,
            resume.portfolio,
            resume.topProjectLevel,
            resume.achievements,
            resume.activities,
          ];
          const nonEmpty = fields.filter((f) => f !== '' && f != null).length;
          const expected = nonEmpty / 6 * 100;
          const actual = computeResumeScore(resume);
          return actual === expected;
        }),
        { numRuns: 100 }
      );
    });

    it('returns a value in [0, 100] for any resume object', () => {
      fc.assert(
        fc.property(resumeArb, (resume) => {
          const score = computeResumeScore(resume);
          return score >= 0 && score <= 100;
        }),
        { numRuns: 100 }
      );
    });
  });
});
