// Feature: placement-prep-tool, Property 10: Recommendations match threshold violations
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getRecommendations, THRESHOLDS } from '../src/js/recommendationEngine.js';

const DSA_REC    = 'Solve more topic-based DSA questions to strengthen your coding skills.';
const PROJ_REC   = 'Build or finish more projects to improve your projects score.';
const CS_REC     = 'Complete incomplete core CS subject topics (DBMS, OS, Networks, OOP).';
const APT_REC    = 'Practise more aptitude questions across Quantitative, Logical, and Verbal sections.';
const RESUME_REC = 'Fill in missing resume sections: links, achievements, and activities.';
const ALL_PASS   = 'Great job! Your profile is well-rounded. Focus on mock interviews.';

const scoreArb = fc.float({ min: 0, max: 100, noNaN: true });

const scoresArb = fc.record({
  dsa:      scoreArb,
  projects: scoreArb,
  cs:       scoreArb,
  aptitude: scoreArb,
  resume:   scoreArb,
});

describe('recommendationEngine', () => {
  // Property 10: Recommendations match threshold violations
  it('Property 10: each recommendation appears iff its threshold is violated', () => {
    fc.assert(
      fc.property(scoresArb, (scores) => {
        const recs = getRecommendations(scores);

        // DSA: threshold 60
        if (scores.dsa < THRESHOLDS.dsa) {
          expect(recs).toContain(DSA_REC);
        } else {
          expect(recs).not.toContain(DSA_REC);
        }

        // Projects: threshold 60
        if (scores.projects < THRESHOLDS.projects) {
          expect(recs).toContain(PROJ_REC);
        } else {
          expect(recs).not.toContain(PROJ_REC);
        }

        // CS: threshold 70
        if (scores.cs < THRESHOLDS.cs) {
          expect(recs).toContain(CS_REC);
        } else {
          expect(recs).not.toContain(CS_REC);
        }

        // Aptitude: threshold 50
        if (scores.aptitude < THRESHOLDS.aptitude) {
          expect(recs).toContain(APT_REC);
        } else {
          expect(recs).not.toContain(APT_REC);
        }

        // Resume: threshold 100
        if (scores.resume < THRESHOLDS.resume) {
          expect(recs).toContain(RESUME_REC);
        } else {
          expect(recs).not.toContain(RESUME_REC);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('Property 10: all-pass scores return only the congratulatory message', () => {
    fc.assert(
      fc.property(
        fc.record({
          dsa:      fc.float({ min: THRESHOLDS.dsa,      max: 100, noNaN: true }),
          projects: fc.float({ min: THRESHOLDS.projects, max: 100, noNaN: true }),
          cs:       fc.float({ min: THRESHOLDS.cs,       max: 100, noNaN: true }),
          aptitude: fc.float({ min: THRESHOLDS.aptitude, max: 100, noNaN: true }),
          resume:   fc.float({ min: THRESHOLDS.resume,   max: 100, noNaN: true }),
        }),
        (scores) => {
          const recs = getRecommendations(scores);
          expect(recs).toEqual([ALL_PASS]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 10: idempotence — two calls with same input produce equal arrays', () => {
    fc.assert(
      fc.property(scoresArb, (scores) => {
        const first  = getRecommendations(scores);
        const second = getRecommendations(scores);
        expect(first).toEqual(second);
      }),
      { numRuns: 100 }
    );
  });
});
