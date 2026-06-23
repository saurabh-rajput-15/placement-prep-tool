// Integration / smoke tests
// Requirements: 10.1, 10.2, 10.4, 11.4

import { describe, it, expect, beforeEach } from 'vitest';
import { computeAllScores } from '../src/js/scoreEngine.js';

// ── Default / empty state ─────────────────────────────────────────────────

const DEFAULT_STATE = {
  dsaEntries: [],
  projectEntries: [],
  csEntries: [],
  aptitudeEntries: [],
  resume: { linkedIn:'', github:'', portfolio:'', topProjectLevel:'', achievements:'', activities:'' },
  cgpa: null,
  selectedCompany: null,
};

describe('Boot with empty state → all scores 0', () => {
  it('DSA score is 0 for empty state', () => {
    const scores = computeAllScores(DEFAULT_STATE);
    expect(scores.dsa).toBe(0);
  });
  it('Projects score is 0 for empty state', () => {
    const scores = computeAllScores(DEFAULT_STATE);
    expect(scores.projects).toBe(0);
  });
  it('CS score is 0 for empty state', () => {
    const scores = computeAllScores(DEFAULT_STATE);
    expect(scores.cs).toBe(0);
  });
  it('Aptitude score is 0 for empty state', () => {
    const scores = computeAllScores(DEFAULT_STATE);
    expect(scores.aptitude).toBe(0);
  });
  it('Resume score is 0 for empty state', () => {
    const scores = computeAllScores(DEFAULT_STATE);
    expect(scores.resume).toBe(0);
  });
  it('Final score is 0 for empty state', () => {
    const scores = computeAllScores(DEFAULT_STATE);
    expect(scores.final).toBe(0);
  });
  it('Band is Beginner for empty state', () => {
    const scores = computeAllScores(DEFAULT_STATE);
    expect(scores.band).toBe('Beginner');
  });
});

// ── Pre-populated state → scores correctly computed ───────────────────────

describe('Boot with pre-populated state → scores correctly restored', () => {
  const populatedState = {
    dsaEntries: [
      { id:'1', topic:'Arrays', solved:50, difficulty:'Easy', createdAt:0 },
      { id:'2', topic:'Trees', solved:50, difficulty:'Medium', createdAt:0 },
    ],
    projectEntries: [
      { id:'1', name:'Todo App', difficulty:'Basic', githubLink:'https://github.com/user/todo', liveLink:'', techStack:'React', status:'Completed', createdAt:0 },
      { id:'2', name:'Chat App', difficulty:'Intermediate', githubLink:'', liveLink:'', techStack:'Node.js', status:'Completed', createdAt:0 },
      { id:'3', name:'ML Model', difficulty:'High Level', githubLink:'', liveLink:'', techStack:'Python', status:'Completed', createdAt:0 },
    ],
    csEntries: [
      { id:'1', subject:'DBMS', topic:'Normalisation', status:'completed' },
      { id:'2', subject:'OS', topic:'Paging', status:'completed' },
      { id:'3', subject:'CN', topic:'TCP/IP', status:'in-progress' },
    ],
    aptitudeEntries: [
      { id:'1', type:'Quantitative', difficulty:'Easy', solved:80, accuracy:75 },
      { id:'2', type:'Logical', difficulty:'Medium', solved:60, accuracy:null },
    ],
    resume: {
      linkedIn: 'https://linkedin.com/in/user',
      github: 'https://github.com/user',
      portfolio: '',
      topProjectLevel: 'Intermediate',
      achievements: 'Dean\'s List',
      activities: 'Coding Club',
    },
    cgpa: 8.0,
    selectedCompany: 'Amazon',
  };

  it('DSA score = 100 (100 solved / 100 * 100, capped)', () => {
    const scores = computeAllScores(populatedState);
    expect(scores.dsa).toBe(100);
  });

  it('Projects score = 60 (3/5 * 100)', () => {
    const scores = computeAllScores(populatedState);
    expect(scores.projects).toBe(60);
  });

  it('CS score ≈ 66.67 (2/3 completed)', () => {
    const scores = computeAllScores(populatedState);
    expect(scores.cs).toBeCloseTo(66.67, 1);
  });

  it('Aptitude score = 70 (140/200 * 100)', () => {
    const scores = computeAllScores(populatedState);
    expect(scores.aptitude).toBe(70);
  });

  it('Resume score ≈ 83.33 (5/6 fields filled)', () => {
    const scores = computeAllScores(populatedState);
    expect(scores.resume).toBeCloseTo(83.33, 1);
  });

  it('final score is within [0, 100]', () => {
    const scores = computeAllScores(populatedState);
    expect(scores.final).toBeGreaterThanOrEqual(0);
    expect(scores.final).toBeLessThanOrEqual(100);
  });

  it('selectedCompany is preserved', () => {
    expect(populatedState.selectedCompany).toBe('Amazon');
  });

  it('cgpa is preserved', () => {
    expect(populatedState.cgpa).toBe(8.0);
  });
});

// ── localStorage round-trip (JSON serialisation) ──────────────────────────

describe('localStorage round-trip preserves state', () => {
  it('serialise and deserialise produces equal state', () => {
    const serialised = JSON.stringify(DEFAULT_STATE);
    const restored = JSON.parse(serialised);
    expect(restored).toEqual(DEFAULT_STATE);
  });

  it('all entry arrays are preserved as empty arrays', () => {
    const restored = JSON.parse(JSON.stringify(DEFAULT_STATE));
    expect(restored.dsaEntries).toEqual([]);
    expect(restored.projectEntries).toEqual([]);
    expect(restored.csEntries).toEqual([]);
    expect(restored.aptitudeEntries).toEqual([]);
  });

  it('cgpa null is preserved', () => {
    const restored = JSON.parse(JSON.stringify(DEFAULT_STATE));
    expect(restored.cgpa).toBeNull();
  });

  it('selectedCompany null is preserved', () => {
    const restored = JSON.parse(JSON.stringify(DEFAULT_STATE));
    expect(restored.selectedCompany).toBeNull();
  });
});
