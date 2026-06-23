// Activity stats and progress helpers for the dashboard

/** Score-engine caps used as progress targets. */
export const PROGRESS_TARGETS = {
  dsaSolved: 100,
  projectCount: 5,
  aptitudeSolved: 200,
  csPercent: 100,
  resumeFields: 6,
};

const RESUME_FIELDS = [
  'linkedIn', 'github', 'portfolio', 'topProjectLevel', 'achievements', 'activities',
];

/**
 * @param {import('./store.js').AppState} state
 * @returns {{
 *   totalDSASolved: number,
 *   totalProjects: number,
 *   csCompleted: number,
 *   csTotal: number,
 *   totalAptitudeSolved: number,
 *   resumeFieldsFilled: number,
 *   cgpa: number | null,
 *   selectedCompany: string | null,
 * }}
 */
export function computeActivityStats(state) {
  const dsaEntries = Array.isArray(state.dsaEntries) ? state.dsaEntries : [];
  const projectEntries = Array.isArray(state.projectEntries) ? state.projectEntries : [];
  const csEntries = Array.isArray(state.csEntries) ? state.csEntries : [];
  const aptitudeEntries = Array.isArray(state.aptitudeEntries) ? state.aptitudeEntries : [];
  const resume = state.resume || {};

  return {
    totalDSASolved: dsaEntries.reduce((sum, e) => sum + (Number(e.solved) || 0), 0),
    totalProjects: projectEntries.length,
    csCompleted: csEntries.filter((e) => e.status === 'completed').length,
    csTotal: csEntries.length,
    totalAptitudeSolved: aptitudeEntries.reduce((sum, e) => sum + (Number(e.solved) || 0), 0),
    resumeFieldsFilled: RESUME_FIELDS.filter((f) => String(resume[f] || '').trim() !== '').length,
    cgpa: state.cgpa ?? null,
    selectedCompany: state.selectedCompany ?? null,
  };
}

/**
 * @param {number} current
 * @param {number} target
 * @returns {number} 0–100
 */
export function progressPercent(current, target) {
  if (target <= 0) return 0;
  return Math.min((current / target) * 100, 100);
}

/**
 * @param {import('./store.js').AppState} state
 * @param {import('./scoreEngine.js').ScoreResult} scores
 * @returns {{ label: string, hash: string, score: number } | null}
 */
export function getWeakestModule(scores) {
  const modules = [
    { label: 'DSA', hash: '#dsa', score: scores.dsa },
    { label: 'Projects', hash: '#projects', score: scores.projects },
    { label: 'CS Subjects', hash: '#cs', score: scores.cs },
    { label: 'Aptitude', hash: '#aptitude', score: scores.aptitude },
    { label: 'Resume', hash: '#resume', score: scores.resume },
  ];
  if (modules.every((m) => m.score >= 100)) return null;
  return modules.reduce((min, m) => (m.score < min.score ? m : min), modules[0]);
}
