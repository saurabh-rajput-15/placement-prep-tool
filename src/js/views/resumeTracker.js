// Resume Tracker view
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5

import { Store } from '../store.js';
import { warnURL } from '../utils/validation.js';

/**
 * @param {import('../store.js').AppState} state
 * @param {{ resume: number }} scores
 * @returns {HTMLElement}
 */
export function render(state, scores) {
  const section = document.createElement('section');

  // Header
  const header = document.createElement('div');
  header.className = 'section-header';
  const title = document.createElement('h2');
  title.className = 'section-title'; title.textContent = 'Resume Tracker';
  const badge = document.createElement('div');
  badge.className = 'score-card'; badge.style.display = 'inline-block';
  badge.innerHTML = `<div class="score-card__label">Resume Score</div><div class="score-card__value">${scores.resume.toFixed(1)}%</div>`;
  header.appendChild(title); header.appendChild(badge);
  section.appendChild(header);

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = '<h3 class="card-title">Your Profile</h3>';

  const form = document.createElement('form');
  form.className = 'form'; form.setAttribute('novalidate', '');

  const resume = state.resume || {};

  function makeGroup(id, labelText, inputEl, warnEl) {
    const g = document.createElement('div'); g.className = 'form-group';
    const l = document.createElement('label'); l.setAttribute('for', id); l.textContent = labelText;
    g.appendChild(l); g.appendChild(inputEl);
    if (warnEl) g.appendChild(warnEl);
    return g;
  }

  function makeInput(id, val, placeholder) {
    const i = document.createElement('input'); i.type = 'text';
    i.id = id; i.value = val || ''; i.placeholder = placeholder || ''; return i;
  }

  function makeWarn() { const s = document.createElement('span'); s.className = 'field-warn'; return s; }

  function makeTextarea(id, val, placeholder) {
    const t = document.createElement('textarea');
    t.id = id; t.value = val || ''; t.placeholder = placeholder || ''; return t;
  }

  const linkedInInput = makeInput('res-linkedin', resume.linkedIn, 'https://linkedin.com/in/...');
  const linkedInWarn = makeWarn();
  const githubInput = makeInput('res-github', resume.github, 'https://github.com/...');
  const githubWarn = makeWarn();
  const portfolioInput = makeInput('res-portfolio', resume.portfolio, 'https://...');
  const portfolioWarn = makeWarn();

  const projectLevelSelect = document.createElement('select');
  projectLevelSelect.id = 're-level';
  ['', 'Basic', 'Intermediate', 'High Level'].forEach(v => {
    const o = document.createElement('option'); o.value = v;
    o.textContent = v || '— Select level —';
    if (v === (resume.topProjectLevel || '')) o.selected = true;
    projectLevelSelect.appendChild(o);
  });

  const achievementsTextarea = makeTextarea('res-achievements', resume.achievements, 'List your achievements...');
  const activitiesTextarea = makeTextarea('res-activities', resume.activities, 'Positions of responsibility, clubs...');

  const row1 = document.createElement('div'); row1.className = 'form-row';
  row1.appendChild(makeGroup('res-linkedin', 'LinkedIn URL', linkedInInput, linkedInWarn));
  row1.appendChild(makeGroup('res-github', 'GitHub URL', githubInput, githubWarn));
  row1.appendChild(makeGroup('res-portfolio', 'Portfolio URL', portfolioInput, portfolioWarn));
  form.appendChild(row1);

  const row2 = document.createElement('div'); row2.className = 'form-row';
  row2.appendChild(makeGroup('re-level', 'Highest Project Level', projectLevelSelect, null));
  form.appendChild(row2);

  form.appendChild(makeGroup('res-achievements', 'Achievements', achievementsTextarea, null));
  form.appendChild(makeGroup('res-activities', 'Activities / Positions', activitiesTextarea, null));

  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit'; saveBtn.className = 'btn btn-primary mt-md'; saveBtn.textContent = 'Save Profile';
  form.appendChild(saveBtn);

  form.addEventListener('submit', e => {
    e.preventDefault();
    linkedInWarn.textContent = ''; githubWarn.textContent = ''; portfolioWarn.textContent = '';

    const liW = warnURL(linkedInInput.value); if (liW.warn) linkedInWarn.textContent = liW.message;
    const ghW = warnURL(githubInput.value);   if (ghW.warn) githubWarn.textContent = ghW.message;
    const pfW = warnURL(portfolioInput.value); if (pfW.warn) portfolioWarn.textContent = pfW.message;

    Store.commit({
      resume: {
        linkedIn: linkedInInput.value,
        github: githubInput.value,
        portfolio: portfolioInput.value,
        topProjectLevel: projectLevelSelect.value,
        achievements: achievementsTextarea.value,
        activities: activitiesTextarea.value,
      }
    });
  });

  card.appendChild(form);
  section.appendChild(card);
  return section;
}
