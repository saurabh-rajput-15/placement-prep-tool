// Dashboard view — overview, stats, progress, and recommendations

import { getRecommendations } from '../recommendationEngine.js';
import {
  computeActivityStats,
  progressPercent,
  getWeakestModule,
  PROGRESS_TARGETS,
} from '../statsEngine.js';
import { createElement } from '../utils/dom.js';

function bandModifier(band) {
  switch (band) {
    case 'Interview Ready': return 'readiness-band--interview-ready';
    case 'Strong':          return 'readiness-band--strong';
    case 'Moderate':        return 'readiness-band--moderate';
    case 'Beginner':
    default:                return 'readiness-band--beginner';
  }
}

function scoreColorClass(score) {
  if (score >= 80) return 'progress-bar__fill--high';
  if (score >= 50) return 'progress-bar__fill--mid';
  return 'progress-bar__fill--low';
}

/**
 * @param {string} label
 * @param {number} current
 * @param {number} target
 * @param {string} unit
 * @returns {HTMLElement}
 */
function progressRow(label, current, target, unit) {
  const pct = progressPercent(current, target);
  const row = createElement('div', { className: 'progress-item' });
  row.appendChild(
    createElement('div', { className: 'progress-item__header' },
      createElement('span', { className: 'progress-item__label' }, label),
      createElement('span', { className: 'progress-item__value' }, `${current} / ${target} ${unit}`)
    )
  );
  const track = createElement('div', { className: 'progress-bar', role: 'progressbar', 'aria-valuenow': String(Math.round(pct)), 'aria-valuemin': '0', 'aria-valuemax': '100' });
  const fill = createElement('div', {
    className: `progress-bar__fill ${scoreColorClass(pct)}`,
    style: { width: `${pct}%` },
  });
  track.appendChild(fill);
  row.appendChild(track);
  return row;
}

/**
 * @param {import('../store.js').AppState} state
 * @param {{ dsa: number, projects: number, cs: number, aptitude: number, resume: number, final: number, band: string }} scores
 * @returns {HTMLElement}
 */
export function render(state, scores) {
  const stats = computeActivityStats(state);
  const weakest = getWeakestModule(scores);
  const allClear = scores.dsa >= 60 && scores.projects >= 60 && scores.cs >= 70 &&
    scores.aptitude >= 50 && scores.resume >= 100;

  const section = createElement('section', { className: 'dashboard' });

  // Header
  section.appendChild(
    createElement('div', { className: 'section-header' },
      createElement('h1', { className: 'section-title' }, 'Dashboard'),
      createElement('p', { className: 'text-muted dashboard__subtitle' }, 'Your placement readiness at a glance')
    )
  );

  // Hero row: score ring + quick stats
  const hero = createElement('div', { className: 'dashboard-hero mb-lg' });

  const scoreCard = createElement('div', { className: 'card dashboard-hero__score' });
  scoreCard.appendChild(createElement('h2', { className: 'card-title' }, 'Final Readiness'));

  const ringWrap = createElement('div', { className: 'score-ring-wrap' });
  const ring = createElement('div', {
    className: 'score-ring',
    style: { '--score-pct': String(scores.final) },
  });
  ring.appendChild(
    createElement('div', { className: 'score-ring__inner' },
      createElement('span', { className: 'score-ring__value' }, `${scores.final.toFixed(1)}%`),
      createElement('span', { className: 'score-ring__label' }, 'Ready')
    )
  );
  ringWrap.appendChild(ring);
  scoreCard.appendChild(ringWrap);

  scoreCard.appendChild(
    createElement('span', { className: `readiness-band ${bandModifier(scores.band)} mt-sm` }, scores.band)
  );

  if (weakest) {
    scoreCard.appendChild(
      createElement('p', { className: 'dashboard-focus mt-md' },
        'Focus area: ',
        createElement('a', { href: weakest.hash, className: 'dashboard-focus__link' }, `${weakest.label} (${weakest.score.toFixed(0)}%)`)
      )
    );
  }

  hero.appendChild(scoreCard);

  // Quick stats grid
  const statsCard = createElement('div', { className: 'card dashboard-hero__stats' });
  statsCard.appendChild(createElement('h2', { className: 'card-title' }, 'Activity Summary'));

  const statGrid = createElement('div', { className: 'stat-grid' });
  const statItems = [
    { icon: '💻', value: stats.totalDSASolved, label: 'DSA Solved' },
    { icon: '🚀', value: stats.totalProjects, label: 'Projects' },
    { icon: '📚', value: `${stats.csCompleted}/${stats.csTotal}`, label: 'CS Topics Done' },
    { icon: '🧠', value: stats.totalAptitudeSolved, label: 'Aptitude Solved' },
    { icon: '📄', value: `${stats.resumeFieldsFilled}/6`, label: 'Resume Fields' },
    { icon: '🎯', value: stats.selectedCompany || '—', label: 'Target Co.' },
  ];
  for (const item of statItems) {
    statGrid.appendChild(
      createElement('div', { className: 'stat-item' },
        createElement('span', { className: 'stat-item__icon', 'aria-hidden': 'true' }, item.icon),
        createElement('span', { className: 'stat-item__value' }, String(item.value)),
        createElement('span', { className: 'stat-item__label' }, item.label)
      )
    );
  }
  statsCard.appendChild(statGrid);
  hero.appendChild(statsCard);
  section.appendChild(hero);

  // Progress toward goals
  const progressCard = createElement('div', { className: 'card mb-lg' });
  progressCard.appendChild(createElement('h2', { className: 'card-title' }, 'Progress Toward Goals'));

  progressCard.appendChild(progressRow('DSA Questions', stats.totalDSASolved, PROGRESS_TARGETS.dsaSolved, 'questions'));
  progressCard.appendChild(progressRow('Projects', stats.totalProjects, PROGRESS_TARGETS.projectCount, 'projects'));
  progressCard.appendChild(progressRow('Aptitude Questions', stats.totalAptitudeSolved, PROGRESS_TARGETS.aptitudeSolved, 'questions'));
  progressCard.appendChild(progressRow('Resume Sections', stats.resumeFieldsFilled, PROGRESS_TARGETS.resumeFields, 'fields'));

  if (stats.csTotal > 0) {
    progressCard.appendChild(progressRow('CS Topics Completed', stats.csCompleted, stats.csTotal, 'topics'));
  } else {
    progressCard.appendChild(
      createElement('p', { className: 'text-muted mt-sm' }, 'Add CS topics to track subject completion progress.')
    );
  }
  section.appendChild(progressCard);

  // Module scores with progress bars
  const moduleCard = createElement('div', { className: 'card mb-lg' });
  moduleCard.appendChild(createElement('h2', { className: 'card-title' }, 'Module Scores'));

  const modules = [
    { label: 'DSA', value: scores.dsa, hash: '#dsa' },
    { label: 'Projects', value: scores.projects, hash: '#projects' },
    { label: 'CS Subjects', value: scores.cs, hash: '#cs' },
    { label: 'Aptitude', value: scores.aptitude, hash: '#aptitude' },
    { label: 'Resume', value: scores.resume, hash: '#resume' },
  ];

  const moduleGrid = createElement('div', { className: 'module-score-list' });
  for (const mod of modules) {
    const item = createElement('a', { href: mod.hash, className: 'module-score-item' });
    item.appendChild(
      createElement('div', { className: 'module-score-item__header' },
        createElement('span', { className: 'module-score-item__label' }, mod.label),
        createElement('span', { className: 'module-score-item__value' }, `${mod.value.toFixed(1)}%`)
      )
    );
    const track = createElement('div', { className: 'progress-bar progress-bar--sm' });
    track.appendChild(
      createElement('div', {
        className: `progress-bar__fill ${scoreColorClass(mod.value)}`,
        style: { width: `${mod.value}%` },
      })
    );
    item.appendChild(track);
    moduleGrid.appendChild(item);
  }
  moduleCard.appendChild(moduleGrid);
  section.appendChild(moduleCard);

  // Quick actions
  const actionsCard = createElement('div', { className: 'card mb-lg' });
  actionsCard.appendChild(createElement('h2', { className: 'card-title' }, 'Quick Actions'));
  const actions = createElement('div', { className: 'quick-actions' });
  const links = [
    { href: '#dsa', label: 'Log DSA', icon: '💻' },
    { href: '#projects', label: 'Add Project', icon: '🚀' },
    { href: '#company', label: 'Simulate', icon: '🏢' },
    { href: '#settings', label: 'Settings', icon: '⚙️' },
  ];
  for (const link of links) {
    actions.appendChild(
      createElement('a', { href: link.href, className: 'quick-action-btn' },
        createElement('span', { 'aria-hidden': 'true' }, link.icon),
        link.label
      )
    );
  }
  actionsCard.appendChild(actions);
  section.appendChild(actionsCard);

  // Recommendations
  const recCard = createElement('div', { className: 'card' });
  recCard.appendChild(createElement('h2', { className: 'card-title' }, 'Recommendations'));

  const recommendations = getRecommendations(scores);
  const recList = createElement('ul', { className: 'recommendations' });
  for (const rec of recommendations) {
    const li = createElement('li', { className: allClear ? 'success' : '' }, rec);
    recList.appendChild(li);
  }
  recCard.appendChild(recList);
  section.appendChild(recCard);

  return section;
}
