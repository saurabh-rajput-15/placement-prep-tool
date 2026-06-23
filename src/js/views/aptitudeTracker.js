// Aptitude Tracker view
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6

import { Store } from '../store.js';
import { validateNonNegInt, validateAccuracy } from '../utils/validation.js';

/**
 * @param {import('../store.js').AppState} state
 * @param {{ aptitude: number }} scores
 * @returns {HTMLElement}
 */
export function render(state, scores) {
  const section = document.createElement('section');

  // Header
  const header = document.createElement('div');
  header.className = 'section-header';
  const title = document.createElement('h2');
  title.className = 'section-title'; title.textContent = 'Aptitude Tracker';
  const badge = document.createElement('div');
  badge.className = 'score-card'; badge.style.display = 'inline-block';
  badge.innerHTML = `<div class="score-card__label">Aptitude Score</div><div class="score-card__value">${scores.aptitude.toFixed(1)}%</div>`;
  header.appendChild(title); header.appendChild(badge);
  section.appendChild(header);

  // Add form
  const formCard = document.createElement('div');
  formCard.className = 'card mb-lg';
  formCard.innerHTML = '<h3 class="card-title">Add Aptitude Session</h3>';

  const form = document.createElement('form');
  form.className = 'form'; form.setAttribute('novalidate', '');

  function makeSelect(id, opts) {
    const s = document.createElement('select'); s.id = id;
    opts.forEach(o => { const op = document.createElement('option'); op.value = o; op.textContent = o; s.appendChild(op); });
    return s;
  }
  function makeInput(id, type, placeholder) {
    const i = document.createElement('input'); i.type = type; i.id = id; i.placeholder = placeholder || ''; return i;
  }
  function makeGroup(id, labelText, inputEl, errorEl) {
    const g = document.createElement('div'); g.className = 'form-group';
    const l = document.createElement('label'); l.setAttribute('for', id); l.textContent = labelText;
    g.appendChild(l); g.appendChild(inputEl);
    if (errorEl) g.appendChild(errorEl);
    return g;
  }
  function makeError() { const s = document.createElement('span'); s.className = 'field-error'; return s; }

  const typeSelect = makeSelect('apt-type', ['Quantitative', 'Logical', 'Verbal']);
  const diffSelect = makeSelect('apt-diff', ['Easy', 'Medium', 'Hard']);
  const solvedInput = makeInput('apt-solved', 'number', '0');
  solvedInput.min = '0'; solvedInput.step = '1';
  const solvedError = makeError();
  const accuracyInput = makeInput('apt-accuracy', 'number', 'Optional (0–100)');
  accuracyInput.min = '0'; accuracyInput.max = '100';
  const accuracyError = makeError();

  const row = document.createElement('div'); row.className = 'form-row';
  row.appendChild(makeGroup('apt-type', 'Type', typeSelect, null));
  row.appendChild(makeGroup('apt-diff', 'Difficulty', diffSelect, null));
  row.appendChild(makeGroup('apt-solved', 'Questions Solved', solvedInput, solvedError));
  row.appendChild(makeGroup('apt-accuracy', 'Accuracy % (optional)', accuracyInput, accuracyError));
  form.appendChild(row);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit'; submitBtn.className = 'btn btn-primary mt-sm'; submitBtn.textContent = 'Add Session';
  form.appendChild(submitBtn);

  form.addEventListener('submit', e => {
    e.preventDefault();
    solvedError.textContent = ''; solvedInput.classList.remove('error');
    accuracyError.textContent = ''; accuracyInput.classList.remove('error');

    const solvedRes = validateNonNegInt(solvedInput.value);
    const accRes = validateAccuracy(accuracyInput.value);
    let hasError = false;
    if (!solvedRes.valid) { solvedError.textContent = solvedRes.error; solvedInput.classList.add('error'); hasError = true; }
    if (!accRes.valid) { accuracyError.textContent = accRes.error; accuracyInput.classList.add('error'); hasError = true; }
    if (hasError) return;

    const newEntry = {
      id: Date.now().toString(),
      type: typeSelect.value,
      difficulty: diffSelect.value,
      solved: Number(solvedInput.value),
      accuracy: accuracyInput.value !== '' ? Number(accuracyInput.value) : null,
    };
    const cur = Store.getState();
    Store.commit({ aptitudeEntries: [...cur.aptitudeEntries, newEntry] });
  });

  formCard.appendChild(form);
  section.appendChild(formCard);

  // Entries table
  const tableCard = document.createElement('div');
  tableCard.className = 'card';
  tableCard.innerHTML = '<h3 class="card-title">Your Sessions</h3>';

  if (state.aptitudeEntries.length === 0) {
    const p = document.createElement('p'); p.className = 'text-muted text-center mt-md';
    p.textContent = 'No aptitude sessions yet. Add one above!';
    tableCard.appendChild(p);
  } else {
    const wrapper = document.createElement('div'); wrapper.className = 'table-wrapper';
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    ['Type', 'Difficulty', 'Solved', 'Accuracy', ''].forEach(t => {
      const th = document.createElement('th'); th.textContent = t; hr.appendChild(th);
    });
    thead.appendChild(hr); table.appendChild(thead);

    const tbody = document.createElement('tbody');
    state.aptitudeEntries.forEach(entry => {
      const tr = document.createElement('tr');
      function td(text) { const c = document.createElement('td'); c.textContent = text; return c; }
      tr.appendChild(td(entry.type));
      tr.appendChild(td(entry.difficulty));
      tr.appendChild(td(String(entry.solved)));
      tr.appendChild(td(entry.accuracy !== null ? `${entry.accuracy}%` : '—'));

      const actionTd = document.createElement('td');
      const delBtn = document.createElement('button');
      delBtn.type = 'button'; delBtn.className = 'btn btn-danger btn-sm'; delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => {
        const cur = Store.getState();
        Store.commit({ aptitudeEntries: cur.aptitudeEntries.filter(e => e.id !== entry.id) });
      });
      actionTd.appendChild(delBtn);
      tr.appendChild(actionTd);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    tableCard.appendChild(wrapper);
  }

  section.appendChild(tableCard);
  return section;
}
