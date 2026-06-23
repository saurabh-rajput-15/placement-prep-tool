// Feature: placement-prep-tool
// Validation utility property-based tests
// Properties 8 & 9 — implemented in task 2.3 / 19.2

import * as fc from 'fast-check';
import {
  validateText,
  validateNonNegInt,
  validateAccuracy,
  validateCGPA,
} from '../src/js/utils/validation.js';

describe('validation', () => {
  // Feature: placement-prep-tool, Property 8: Whitespace-only text inputs are always rejected
  // Validates: Requirements 2.6, 3.7, 4.7
  test('Property 8: validateText rejects any whitespace-only string', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^\s+$/),
        (whitespaceStr) => {
          const result = validateText(whitespaceStr);
          // Must be invalid
          expect(result.valid).toBe(false);
          // Must return a non-empty error message
          expect(typeof result.error).toBe('string');
          expect(result.error.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: placement-prep-tool, Property 9: Out-of-range numeric inputs are always rejected
  // Validates: Requirements 2.6, 5.6, 9.8

  test('Property 9a: validateNonNegInt rejects any negative integer', () => {
    fc.assert(
      fc.property(
        fc.integer({ max: -1 }),
        (negInt) => {
          const result = validateNonNegInt(negInt);
          expect(result.valid).toBe(false);
          expect(typeof result.error).toBe('string');
          expect(result.error.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9b: validateAccuracy rejects floats strictly outside [0, 100]', () => {
    // Below 0
    fc.assert(
      fc.property(
        fc.float({ max: -Number.EPSILON, noNaN: true }),
        (belowZero) => {
          const result = validateAccuracy(belowZero);
          expect(result.valid).toBe(false);
          expect(typeof result.error).toBe('string');
          expect(result.error.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );

    // Above 100
    fc.assert(
      fc.property(
        fc.float({ min: 100 + Number.EPSILON, noNaN: true, noDefaultInfinity: true }),
        (above100) => {
          // Guard: only test values strictly > 100
          if (above100 <= 100) return;
          const result = validateAccuracy(above100);
          expect(result.valid).toBe(false);
          expect(typeof result.error).toBe('string');
          expect(result.error.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 9c: validateCGPA rejects floats strictly outside [0.0, 10.0]', () => {
    // Below 0
    fc.assert(
      fc.property(
        fc.float({ max: -Number.EPSILON, noNaN: true }),
        (belowZero) => {
          const result = validateCGPA(belowZero);
          expect(result.valid).toBe(false);
          expect(typeof result.error).toBe('string');
          expect(result.error.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );

    // Above 10
    fc.assert(
      fc.property(
        fc.float({ min: 10 + Number.EPSILON, noNaN: true, noDefaultInfinity: true }),
        (above10) => {
          // Guard: only test values strictly > 10
          if (above10 <= 10) return;
          const result = validateCGPA(above10);
          expect(result.valid).toBe(false);
          expect(typeof result.error).toBe('string');
          expect(result.error.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
