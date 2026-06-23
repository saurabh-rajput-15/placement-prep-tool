// Pure recommendation logic
// Implementation: task 6.1

export const THRESHOLDS = {
  dsa: 60,
  projects: 60,
  cs: 70,
  aptitude: 50,
  resume: 100,
};

/**
 * Returns an array of recommendation strings based on the provided scores.
 * Each module whose score falls below its threshold contributes one recommendation.
 * When all thresholds are met, a single congratulatory message is returned.
 *
 * @param {{ dsa: number, projects: number, cs: number, aptitude: number, resume: number }} scores
 * @returns {string[]}
 */
export function getRecommendations(scores) {
  const recommendations = [];

  if (scores.dsa < THRESHOLDS.dsa) {
    recommendations.push(
      'Solve more topic-based DSA questions to strengthen your coding skills.'
    );
  }

  if (scores.projects < THRESHOLDS.projects) {
    recommendations.push(
      'Build or finish more projects to improve your projects score.'
    );
  }

  if (scores.cs < THRESHOLDS.cs) {
    recommendations.push(
      'Complete incomplete core CS subject topics (DBMS, OS, Networks, OOP).'
    );
  }

  if (scores.aptitude < THRESHOLDS.aptitude) {
    recommendations.push(
      'Practise more aptitude questions across Quantitative, Logical, and Verbal sections.'
    );
  }

  if (scores.resume < THRESHOLDS.resume) {
    recommendations.push(
      'Fill in missing resume sections: links, achievements, and activities.'
    );
  }

  if (recommendations.length === 0) {
    return ['Great job! Your profile is well-rounded. Focus on mock interviews.'];
  }

  return recommendations;
}
