// Company profiles + gap analysis
// Implementation: task 7.1

/**
 * Static company profiles defining the minimum thresholds required by each
 * target company.
 *
 * @type {Record<string, CompanyProfile>}
 */
export const COMPANY_PROFILES = {
  Google: {
    name: 'Google',
    minDSASolved: 300,
    minProjects: 5,
    minCGPA: 8.0,
    requiredCSSubjects: ['OS', 'DBMS', 'CN', 'OOP', 'DSA'],
    minAptitudeSolved: 150,
  },
  Amazon: {
    name: 'Amazon',
    minDSASolved: 200,
    minProjects: 4,
    minCGPA: 7.5,
    requiredCSSubjects: ['OS', 'DBMS', 'CN', 'OOP'],
    minAptitudeSolved: 100,
  },
  TCS: {
    name: 'TCS',
    minDSASolved: 50,
    minProjects: 2,
    minCGPA: 6.0,
    requiredCSSubjects: ['DBMS', 'OOP'],
    minAptitudeSolved: 100,
  },
  Infosys: {
    name: 'Infosys',
    minDSASolved: 50,
    minProjects: 2,
    minCGPA: 6.5,
    requiredCSSubjects: ['DBMS', 'OOP', 'CN'],
    minAptitudeSolved: 100,
  },
};

/**
 * Derives the set of CS subjects the user has at least one "completed" topic
 * for from their csEntries array.
 *
 * @param {CSEntry[]} csEntries
 * @returns {Set<string>}
 */
function getCoveredSubjects(csEntries) {
  const covered = new Set();
  for (const entry of csEntries) {
    if (entry.status === 'completed') {
      // Normalise to uppercase to allow case-insensitive matching.
      covered.add((entry.subject || '').toUpperCase().trim());
    }
  }
  return covered;
}

/**
 * Computes the company-specific readiness for the given application state.
 *
 * The five tracked metrics are:
 *   1. Total DSA questions solved vs company minDSASolved
 *   2. Total projects count vs company minProjects
 *   3. User CGPA vs company minCGPA
 *   4. Covered CS subjects vs requiredCSSubjects
 *   5. Total aptitude questions solved vs company minAptitudeSolved
 *
 * readinessPercent = (metMetricsCount / 5) × 100
 *
 * For every gap identified, at least one actionable suggestion is generated.
 *
 * @param {AppState} state  - Current application state from Store.getState()
 * @param {string}   companyName - One of "Google", "Amazon", "TCS", "Infosys"
 * @returns {{ readinessPercent: number, gaps: Gap[], suggestions: string[] }}
 */
export function computeCompanyReadiness(state, companyName) {
  const profile = COMPANY_PROFILES[companyName];

  if (!profile) {
    return { readinessPercent: 0, gaps: [], suggestions: [] };
  }

  const dsaEntries      = Array.isArray(state.dsaEntries)      ? state.dsaEntries      : [];
  const projectEntries  = Array.isArray(state.projectEntries)  ? state.projectEntries  : [];
  const csEntries       = Array.isArray(state.csEntries)        ? state.csEntries       : [];
  const aptitudeEntries = Array.isArray(state.aptitudeEntries) ? state.aptitudeEntries : [];

  // -------------------------------------------------------------------------
  // Derived user metrics
  // -------------------------------------------------------------------------
  const totalDSASolved     = dsaEntries.reduce((sum, e) => sum + (Number(e.solved) || 0), 0);
  const totalProjects      = projectEntries.length;
  const userCGPA           = (state.cgpa !== null && state.cgpa !== undefined) ? Number(state.cgpa) : null;
  const coveredSubjects    = getCoveredSubjects(csEntries);
  const totalAptitudeSolved = aptitudeEntries.reduce((sum, e) => sum + (Number(e.solved) || 0), 0);

  const gaps        = /** @type {Gap[]} */ ([]);
  const suggestions = /** @type {string[]} */ ([]);
  let metMetrics    = 0;
  const totalMetrics = 5;

  // -------------------------------------------------------------------------
  // Metric 1: DSA solved
  // -------------------------------------------------------------------------
  if (totalDSASolved >= profile.minDSASolved) {
    metMetrics++;
  } else {
    const remaining = profile.minDSASolved - totalDSASolved;
    const gap = {
      metric: 'DSA Questions Solved',
      current: totalDSASolved,
      required: profile.minDSASolved,
      description: `You have solved ${totalDSASolved} DSA questions but ${companyName} expects at least ${profile.minDSASolved}.`,
    };
    gaps.push(gap);
    suggestions.push(
      `Solve ${remaining} more DSA questions. Focus on topic-wise practice covering Arrays, Trees, Graphs, and Dynamic Programming.`
    );
  }

  // -------------------------------------------------------------------------
  // Metric 2: Projects count
  // -------------------------------------------------------------------------
  if (totalProjects >= profile.minProjects) {
    metMetrics++;
  } else {
    const remaining = profile.minProjects - totalProjects;
    const gap = {
      metric: 'Projects',
      current: totalProjects,
      required: profile.minProjects,
      description: `You have ${totalProjects} project(s) but ${companyName} expects at least ${profile.minProjects}.`,
    };
    gaps.push(gap);
    suggestions.push(
      `Build ${remaining} more project(s). Aim for intermediate-to-high-level projects with a live deployment and a GitHub repository.`
    );
  }

  // -------------------------------------------------------------------------
  // Metric 3: CGPA
  // -------------------------------------------------------------------------
  const cgpaProvided = userCGPA !== null && !isNaN(userCGPA);
  if (cgpaProvided && userCGPA >= profile.minCGPA) {
    metMetrics++;
  } else {
    const gap = {
      metric: 'CGPA',
      current: cgpaProvided ? userCGPA : null,
      required: profile.minCGPA,
      description: cgpaProvided
        ? `Your CGPA of ${userCGPA} is below the ${companyName} minimum of ${profile.minCGPA}.`
        : `${companyName} requires a minimum CGPA of ${profile.minCGPA}. Please enter your CGPA.`,
    };
    gaps.push(gap);
    suggestions.push(
      cgpaProvided
        ? `Your CGPA is currently ${userCGPA}. While CGPA may not be improvable quickly, ensure all other metrics are strong to compensate.`
        : `Enter your CGPA to see whether you meet the ${companyName} threshold of ${profile.minCGPA}.`
    );
  }

  // -------------------------------------------------------------------------
  // Metric 4: CS Subjects coverage
  // -------------------------------------------------------------------------
  const missingSubjects = profile.requiredCSSubjects.filter(
    (subject) => !coveredSubjects.has(subject.toUpperCase().trim())
  );

  if (missingSubjects.length === 0) {
    metMetrics++;
  } else {
    const gap = {
      metric: 'CS Subjects',
      current: profile.requiredCSSubjects.length - missingSubjects.length,
      required: profile.requiredCSSubjects.length,
      description: `You are missing completed topics in: ${missingSubjects.join(', ')}. ${companyName} requires all of: ${profile.requiredCSSubjects.join(', ')}.`,
    };
    gaps.push(gap);
    suggestions.push(
      `Study and mark topics as completed for: ${missingSubjects.join(', ')}. Add topic entries in the CS Subjects Tracker and complete them.`
    );
  }

  // -------------------------------------------------------------------------
  // Metric 5: Aptitude solved
  // -------------------------------------------------------------------------
  if (totalAptitudeSolved >= profile.minAptitudeSolved) {
    metMetrics++;
  } else {
    const remaining = profile.minAptitudeSolved - totalAptitudeSolved;
    const gap = {
      metric: 'Aptitude Questions Solved',
      current: totalAptitudeSolved,
      required: profile.minAptitudeSolved,
      description: `You have solved ${totalAptitudeSolved} aptitude questions but ${companyName} expects at least ${profile.minAptitudeSolved}.`,
    };
    gaps.push(gap);
    suggestions.push(
      `Practise ${remaining} more aptitude questions across Quantitative, Logical, and Verbal sections to meet ${companyName}'s requirement.`
    );
  }

  // -------------------------------------------------------------------------
  // Readiness percentage
  // -------------------------------------------------------------------------
  const readinessPercent = (metMetrics / totalMetrics) * 100;

  return { readinessPercent, gaps, suggestions };
}
