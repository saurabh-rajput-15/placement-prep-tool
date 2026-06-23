// Unit tests for views and router
// Requirements: 1.3-1.6, 2.6, 3.7, 4.7, 5.6, 6.5, 9.8, 11.1-11.4

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Minimal DOM environment setup ─────────────────────────────────────────
// We use vitest's node environment; we mock the DOM primitives needed.

// ── Score Engine boundary tests (Dashboard band labels) ───────────────────
import { computeReadinessBand } from '../src/js/scoreEngine.js';

describe('Dashboard — readiness band boundaries', () => {
  it('score 0 → Beginner', () => expect(computeReadinessBand(0)).toBe('Beginner'));
  it('score 39 → Beginner', () => expect(computeReadinessBand(39)).toBe('Beginner'));
  it('score 39.9 → Beginner', () => expect(computeReadinessBand(39.9)).toBe('Beginner'));
  it('score 40 → Moderate', () => expect(computeReadinessBand(40)).toBe('Moderate'));
  it('score 59 → Moderate', () => expect(computeReadinessBand(59)).toBe('Moderate'));
  it('score 59.9 → Moderate', () => expect(computeReadinessBand(59.9)).toBe('Moderate'));
  it('score 60 → Strong', () => expect(computeReadinessBand(60)).toBe('Strong'));
  it('score 79 → Strong', () => expect(computeReadinessBand(79)).toBe('Strong'));
  it('score 79.9 → Strong', () => expect(computeReadinessBand(79.9)).toBe('Strong'));
  it('score 80 → Interview Ready', () => expect(computeReadinessBand(80)).toBe('Interview Ready'));
  it('score 100 → Interview Ready', () => expect(computeReadinessBand(100)).toBe('Interview Ready'));
});

// ── Validation unit tests ─────────────────────────────────────────────────
import { validateText, validateNonNegInt, validateAccuracy, validateCGPA, warnURL } from '../src/js/utils/validation.js';

describe('DSA Tracker — form validation', () => {
  it('valid topic passes', () => expect(validateText('Binary Trees').valid).toBe(true));
  it('empty topic fails', () => expect(validateText('').valid).toBe(false));
  it('whitespace topic fails', () => expect(validateText('   ').valid).toBe(false));
  it('valid solved (0) passes', () => expect(validateNonNegInt(0).valid).toBe(true));
  it('valid solved (50) passes', () => expect(validateNonNegInt(50).valid).toBe(true));
  it('negative solved fails', () => expect(validateNonNegInt(-1).valid).toBe(false));
  it('empty solved fails', () => expect(validateNonNegInt('').valid).toBe(false));
  it('decimal solved fails', () => expect(validateNonNegInt(1.5).valid).toBe(false));
});

describe('Projects Tracker — form validation', () => {
  it('valid name passes', () => expect(validateText('My App').valid).toBe(true));
  it('empty name fails', () => expect(validateText('').valid).toBe(false));
  it('URL warning for non-http github', () => expect(warnURL('github.com/user/repo').warn).toBe(true));
  it('no warning for https URL', () => expect(warnURL('https://github.com/user').warn).toBe(false));
  it('no warning for empty URL', () => expect(warnURL('').warn).toBe(false));
});

describe('CS Tracker — form validation', () => {
  it('valid subject passes', () => expect(validateText('DBMS').valid).toBe(true));
  it('empty subject fails', () => expect(validateText('').valid).toBe(false));
  it('valid topic passes', () => expect(validateText('Normalisation').valid).toBe(true));
  it('empty topic fails', () => expect(validateText('').valid).toBe(false));
});

describe('Aptitude Tracker — form validation', () => {
  it('valid solved (100) passes', () => expect(validateNonNegInt(100).valid).toBe(true));
  it('negative solved fails', () => expect(validateNonNegInt(-5).valid).toBe(false));
  it('accuracy 0 passes', () => expect(validateAccuracy(0).valid).toBe(true));
  it('accuracy 100 passes', () => expect(validateAccuracy(100).valid).toBe(true));
  it('accuracy 50 passes', () => expect(validateAccuracy(50).valid).toBe(true));
  it('accuracy empty passes (optional)', () => expect(validateAccuracy('').valid).toBe(true));
  it('accuracy -1 fails', () => expect(validateAccuracy(-1).valid).toBe(false));
  it('accuracy 101 fails', () => expect(validateAccuracy(101).valid).toBe(false));
});

describe('Resume Tracker — URL warnings', () => {
  it('no warning for valid https linkedin', () => expect(warnURL('https://linkedin.com/in/user').warn).toBe(false));
  it('warning for linkedin without protocol', () => expect(warnURL('linkedin.com/in/user').warn).toBe(true));
  it('no warning for empty url (optional)', () => expect(warnURL('').warn).toBe(false));
  it('valid http url no warning', () => expect(warnURL('http://myportfolio.com').warn).toBe(false));
});

describe('Company Simulator — CGPA validation', () => {
  it('CGPA 0.0 passes', () => expect(validateCGPA(0).valid).toBe(true));
  it('CGPA 10.0 passes', () => expect(validateCGPA(10).valid).toBe(true));
  it('CGPA 7.5 passes', () => expect(validateCGPA(7.5).valid).toBe(true));
  it('CGPA -0.1 fails', () => expect(validateCGPA(-0.1).valid).toBe(false));
  it('CGPA 10.1 fails', () => expect(validateCGPA(10.1).valid).toBe(false));
  it('empty CGPA fails (required when entered)', () => expect(validateCGPA('').valid).toBe(false));
});

// ── Company Simulator — profile thresholds ────────────────────────────────
import { COMPANY_PROFILES, computeCompanyReadiness } from '../src/js/companySimulator.js';

describe('Company Simulator — company profiles', () => {
  it('has all four companies', () => {
    expect(COMPANY_PROFILES).toHaveProperty('Google');
    expect(COMPANY_PROFILES).toHaveProperty('Amazon');
    expect(COMPANY_PROFILES).toHaveProperty('TCS');
    expect(COMPANY_PROFILES).toHaveProperty('Infosys');
  });

  it('Google has highest DSA threshold', () => {
    expect(COMPANY_PROFILES.Google.minDSASolved).toBe(300);
  });

  it('TCS has lowest CGPA threshold', () => {
    expect(COMPANY_PROFILES.TCS.minCGPA).toBe(6.0);
  });

  it('empty state returns 0% for Google', () => {
    const emptyState = {
      dsaEntries: [], projectEntries: [], csEntries: [], aptitudeEntries: [],
      resume: { linkedIn:'', github:'', portfolio:'', topProjectLevel:'', achievements:'', activities:'' },
      cgpa: null, selectedCompany: null,
    };
    const result = computeCompanyReadiness(emptyState, 'Google');
    expect(result.readinessPercent).toBe(0);
    expect(result.gaps.length).toBe(5);
  });

  it('fully-met TCS requirements return 100%', () => {
    const state = {
      dsaEntries: Array.from({length:5}, (_,i) => ({ id: String(i), topic:'X', solved:20, difficulty:'Easy', createdAt:0 })),
      projectEntries: Array.from({length:2}, (_,i) => ({ id:String(i), name:'P', difficulty:'Basic', githubLink:'', liveLink:'', techStack:'', status:'Completed', createdAt:0 })),
      csEntries: [
        { id:'1', subject:'DBMS', topic:'Normalisation', status:'completed' },
        { id:'2', subject:'OOP', topic:'Inheritance', status:'completed' },
      ],
      aptitudeEntries: Array.from({length:5}, (_,i) => ({ id:String(i), type:'Quantitative', difficulty:'Easy', solved:25, accuracy:null })),
      resume: { linkedIn:'', github:'', portfolio:'', topProjectLevel:'', achievements:'', activities:'' },
      cgpa: 7.0,
      selectedCompany: 'TCS',
    };
    const result = computeCompanyReadiness(state, 'TCS');
    expect(result.readinessPercent).toBe(100);
    expect(result.gaps.length).toBe(0);
  });
});
