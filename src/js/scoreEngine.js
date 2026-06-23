// Pure score computation functions
// Implementation: task 4.1

/**
 * Sum an array of numbers.
 * @param {number[]} arr
 * @returns {number}
 */
function sum(arr) {
  return arr.reduce((acc, v) => acc + v, 0);
}

/**
 * Compute DSA score.
 * Score = min(totalSolved / 100 * 100, 100)
 * @param {Array<{solved: number}>} entries
 * @returns {number} 0–100
 */
export function computeDSAScore(entries) {
  return Math.min(sum(entries.map(e => e.solved)) / 100 * 100, 100);
}

/**
 * Compute Projects score.
 * Score = min(count / 5 * 100, 100)
 * @param {Array<object>} entries
 * @returns {number} 0–100
 */
export function computeProjectsScore(entries) {
  return Math.min(entries.length / 5 * 100, 100);
}

/**
 * Compute CS Subjects score.
 * Score = completedCount / totalCount * 100  (0 when empty)
 * @param {Array<{status: string}>} entries
 * @returns {number} 0–100
 */
export function computeCSScore(entries) {
  if (entries.length === 0) return 0;
  return entries.filter(e => e.status === 'completed').length / entries.length * 100;
}

/**
 * Compute Aptitude score.
 * Score = min(totalSolved / 200 * 100, 100)
 * @param {Array<{solved: number}>} entries
 * @returns {number} 0–100
 */
export function computeAptitudeScore(entries) {
  return Math.min(sum(entries.map(e => e.solved)) / 200 * 100, 100);
}

/**
 * Compute Resume score.
 * Score = nonEmptyFieldCount / 6 * 100
 * Tracks: linkedIn, github, portfolio, topProjectLevel, achievements, activities
 * @param {{linkedIn: string, github: string, portfolio: string, topProjectLevel: string, achievements: string, activities: string}} resume
 * @returns {number} 0–100
 */
export function computeResumeScore(resume) {
  const fields = [
    resume.linkedIn,
    resume.github,
    resume.portfolio,
    resume.topProjectLevel,
    resume.achievements,
    resume.activities,
  ];
  const count = fields.filter(f => f !== '' && f != null).length;
  return count / 6 * 100;
}

/**
 * Compute the weighted Final Readiness Score.
 * Score = dsa*0.35 + projects*0.25 + cs*0.20 + aptitude*0.10 + resume*0.10
 * @param {{dsa: number, projects: number, cs: number, aptitude: number, resume: number}} scores
 * @returns {number} 0–100
 */
export function computeFinalScore(scores) {
  return (
    scores.dsa * 0.35 +
    scores.projects * 0.25 +
    scores.cs * 0.20 +
    scores.aptitude * 0.10 +
    scores.resume * 0.10
  );
}

/**
 * Map a final score to a readiness band label.
 * @param {number} score  A value in [0, 100]
 * @returns {"Beginner"|"Moderate"|"Strong"|"Interview Ready"}
 */
export function computeReadinessBand(score) {
  if (score >= 80) return 'Interview Ready';
  if (score >= 60) return 'Strong';
  if (score >= 40) return 'Moderate';
  return 'Beginner';
}

/**
 * Convenience wrapper — computes all scores from the full app state.
 * @param {{dsaEntries: any[], projectEntries: any[], csEntries: any[], aptitudeEntries: any[], resume: object}} state
 * @returns {{dsa: number, projects: number, cs: number, aptitude: number, resume: number, final: number, band: string}}
 */
export function computeAllScores(state) {
  const dsa = computeDSAScore(state.dsaEntries);
  const projects = computeProjectsScore(state.projectEntries);
  const cs = computeCSScore(state.csEntries);
  const aptitude = computeAptitudeScore(state.aptitudeEntries);
  const resume = computeResumeScore(state.resume);
  const final = computeFinalScore({ dsa, projects, cs, aptitude, resume });
  const band = computeReadinessBand(final);

  return { dsa, projects, cs, aptitude, resume, final, band };
}
