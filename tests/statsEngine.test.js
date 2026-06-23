// Stats engine unit tests

import { describe, it, expect } from 'vitest';
import { computeActivityStats, progressPercent, getWeakestModule, PROGRESS_TARGETS } from '../src/js/statsEngine.js';

const emptyState = {
  dsaEntries: [],
  projectEntries: [],
  csEntries: [],
  aptitudeEntries: [],
  resume: { linkedIn:'', github:'', portfolio:'', topProjectLevel:'', achievements:'', activities:'' },
  cgpa: null,
  selectedCompany: null,
};

describe('statsEngine', () => {
  it('computeActivityStats returns zeros for empty state', () => {
    const stats = computeActivityStats(emptyState);
    expect(stats.totalDSASolved).toBe(0);
    expect(stats.totalProjects).toBe(0);
    expect(stats.csCompleted).toBe(0);
    expect(stats.csTotal).toBe(0);
    expect(stats.totalAptitudeSolved).toBe(0);
    expect(stats.resumeFieldsFilled).toBe(0);
  });

  it('computeActivityStats aggregates entry data', () => {
    const state = {
      ...emptyState,
      dsaEntries: [{ id:'1', topic:'A', solved:30, difficulty:'Easy', createdAt:0 }],
      projectEntries: [{ id:'1', name:'P', difficulty:'Basic', githubLink:'', liveLink:'', techStack:'', status:'Completed', createdAt:0 }],
      csEntries: [
        { id:'1', subject:'OS', topic:'T', status:'completed' },
        { id:'2', subject:'DBMS', topic:'T', status:'in-progress' },
      ],
      aptitudeEntries: [{ id:'1', type:'Quantitative', difficulty:'Easy', solved:50, accuracy:null }],
      resume: { linkedIn:'https://x.com', github:'', portfolio:'', topProjectLevel:'', achievements:'', activities:'' },
      cgpa: 8.5,
      selectedCompany: 'Google',
    };
    const stats = computeActivityStats(state);
    expect(stats.totalDSASolved).toBe(30);
    expect(stats.totalProjects).toBe(1);
    expect(stats.csCompleted).toBe(1);
    expect(stats.csTotal).toBe(2);
    expect(stats.totalAptitudeSolved).toBe(50);
    expect(stats.resumeFieldsFilled).toBe(1);
    expect(stats.cgpa).toBe(8.5);
    expect(stats.selectedCompany).toBe('Google');
  });

  it('progressPercent caps at 100', () => {
    expect(progressPercent(150, PROGRESS_TARGETS.dsaSolved)).toBe(100);
    expect(progressPercent(50, 100)).toBe(50);
    expect(progressPercent(0, 100)).toBe(0);
  });

  it('getWeakestModule returns lowest-scoring module', () => {
    const scores = { dsa: 80, projects: 20, cs: 60, aptitude: 70, resume: 50, final: 50, band: 'Moderate' };
    const weakest = getWeakestModule(scores);
    expect(weakest?.label).toBe('Projects');
    expect(weakest?.hash).toBe('#projects');
  });

  it('getWeakestModule returns null when all at 100', () => {
    const scores = { dsa: 100, projects: 100, cs: 100, aptitude: 100, resume: 100, final: 100, band: 'Interview Ready' };
    expect(getWeakestModule(scores)).toBeNull();
  });
});
