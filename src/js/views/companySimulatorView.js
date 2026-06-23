// Company Simulator view
// Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8

import { Store } from '../store.js';
import { computeCompanyReadiness, COMPANY_PROFILES } from '../companySimulator.js';
import { validateCGPA } from '../utils/validation.js';

/**
 * @param {import('../store.js').AppState} state
 * @param {object} _scores
 * @returns {HTMLElement}
 */
export function render(state, _scores) {
  const section = document.createElement('section');

  // Header
  const header = document.createElement('div');
  header.className = 'section-header';
  const title = document.createElement('h2');
  title.className = 'section-title'; title.textContent = 'Company Simulator';
  header.appendChild(title);
  section.appendChild(header);

  // Controls card
  const controlsCard = document.createElement('div');
  controlsCard.className = 'card mb-lg';
  controlsCard.innerHTML = '<h3 class="card-title">Select Company & Enter CGPA</h3>';

  const controlsRow = document.createElement('div');
  controlsRow.className = 'form-row';

  // Company dropdown
  const companyGroup = document.createElement('div'); companyGroup.className = 'form-group';
  const companyLabel = document.createElement('label'); companyLabel.setAttribute('for', 'sim-company');
  companyLabel.textContent = 'Target Company';
  const companySelect = document.createElement('select'); companySelect.id = 'sim-company';
  const noOpt = document.createElement('option'); noOpt.value = ''; noOpt.textContent = '— Select a company —';
  companySelect.appendChild(noOpt);
  ['Google', 'Amazon', 'TCS', 'Infosys'].forEach(name => {
    const o = document.createElement('option'); o.value = name; o.textContent = name;
    if (name === state.selectedCompany) o.selected = true;
    companySelect.appendChild(o);
  });
  companyGroup.appendChild(companyLabel); companyGroup.appendChild(companySelect);
  controlsRow.appendChild(companyGroup);

  // CGPA input
  const cgpaGroup = document.createElement('div'); cgpaGroup.className = 'form-group';
  const cgpaLabel = document.createElement('label'); cgpaLabel.setAttribute('for', 'sim-cgpa');
  cgpaLabel.textContent = 'Your CGPA (0.0 – 10.0)';
  const cgpaInput = document.createElement('input');
  cgpaInput.type = 'number'; cgpaInput.id = 'sim-cgpa'; cgpaInput.min = '0'; cgpaInput.max = '10';
  cgpaInput.step = '0.01'; cgpaInput.placeholder = 'e.g. 7.5';
  if (state.cgpa !== null && state.cgpa !== undefined) cgpaInput.value = String(state.cgpa);
  const cgpaError = document.createElement('span'); cgpaError.className = 'field-error';
  cgpaGroup.appendChild(cgpaLabel); cgpaGroup.appendChild(cgpaInput); cgpaGroup.appendChild(cgpaError);
  controlsRow.appendChild(cgpaGroup);

  controlsCard.appendChild(controlsRow);

  // CGPA validation on change
  cgpaInput.addEventListener('change', () => {
    cgpaError.textContent = '';
    if (cgpaInput.value === '') return; // allow clearing
    const res = validateCGPA(cgpaInput.value);
    if (!res.valid) { cgpaError.textContent = res.error; cgpaInput.classList.add('error'); return; }
    cgpaInput.classList.remove('error');
    Store.commit({ cgpa: parseFloat(cgpaInput.value) });
  });

  // Company selection triggers analysis
  companySelect.addEventListener('change', () => {
    const name = companySelect.value || null;
    Store.commit({ selectedCompany: name });
    // Store.commit triggers re-render, so results update automatically
  });

  section.appendChild(controlsCard);

  // Results area
  const resultsCard = document.createElement('div');
  resultsCard.className = 'card';

  if (!state.selectedCompany) {
    const p = document.createElement('p'); p.className = 'text-muted text-center mt-md';
    p.textContent = 'Select a company to begin gap analysis.';
    resultsCard.appendChild(p);
  } else {
    const companyName = state.selectedCompany;
    const profile = COMPANY_PROFILES[companyName];
    const result = computeCompanyReadiness(state, companyName);

    // Readiness %
    const readinessBanner = document.createElement('div');
    readinessBanner.className = 'section-header mb-md';
    const readinessLabel = document.createElement('h3');
    readinessLabel.textContent = `${companyName} Readiness`;
    const readinessPct = document.createElement('span');
    readinessPct.className = 'final-score';
    readinessPct.textContent = `${result.readinessPercent.toFixed(0)}%`;
    readinessBanner.appendChild(readinessLabel); readinessBanner.appendChild(readinessPct);
    resultsCard.appendChild(readinessBanner);

    // Thresholds table
    const tableTitle = document.createElement('h4'); tableTitle.className = 'card-title';
    tableTitle.textContent = `${companyName} Requirements`;
    resultsCard.appendChild(tableTitle);

    const wrapper = document.createElement('div'); wrapper.className = 'table-wrapper mb-lg';
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    ['Metric', 'Minimum Required'].forEach(t => {
      const th = document.createElement('th'); th.textContent = t; hr.appendChild(th);
    });
    thead.appendChild(hr); table.appendChild(thead);

    const tbody = document.createElement('tbody');
    const rows = [
      ['DSA Questions Solved', profile.minDSASolved],
      ['Projects', profile.minProjects],
      ['CGPA', profile.minCGPA],
      ['Required CS Subjects', profile.requiredCSSubjects.join(', ')],
      ['Aptitude Questions Solved', profile.minAptitudeSolved],
    ];
    rows.forEach(([metric, val]) => {
      const tr = document.createElement('tr');
      const td1 = document.createElement('td'); td1.textContent = metric;
      const td2 = document.createElement('td'); td2.textContent = String(val);
      tr.appendChild(td1); tr.appendChild(td2); tbody.appendChild(tr);
    });
    table.appendChild(tbody); wrapper.appendChild(table);
    resultsCard.appendChild(wrapper);

    // Gaps & Suggestions
    if (result.gaps.length === 0) {
      const ok = document.createElement('p');
      ok.className = 'text-center mt-md';
      ok.style.color = 'var(--color-success)';
      ok.textContent = `You meet all requirements for ${companyName}!`;
      resultsCard.appendChild(ok);
    } else {
      const gapsTitle = document.createElement('h4'); gapsTitle.className = 'card-title';
      gapsTitle.textContent = 'Gaps & Suggestions';
      resultsCard.appendChild(gapsTitle);

      result.gaps.forEach((gap, i) => {
        const item = document.createElement('div'); item.className = 'gap-item';
        const gapTitle = document.createElement('div'); gapTitle.className = 'gap-item__title';
        gapTitle.textContent = gap.metric;
        const gapDesc = document.createElement('div'); gapDesc.className = 'gap-item__suggestion';
        gapDesc.textContent = gap.description;
        const gapSug = document.createElement('div'); gapSug.className = 'gap-item__suggestion mt-sm';
        gapSug.style.fontStyle = 'italic';
        if (result.suggestions[i]) gapSug.textContent = `💡 ${result.suggestions[i]}`;
        item.appendChild(gapTitle); item.appendChild(gapDesc); item.appendChild(gapSug);
        resultsCard.appendChild(item);
      });
    }
  }

  section.appendChild(resultsCard);
  return section;
}
