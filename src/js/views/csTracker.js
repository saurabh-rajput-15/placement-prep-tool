// CS Subjects Tracker view
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7

import { Store } from '../store.js';
import { validateText } from '../utils/validation.js';

/**
 * @param {import('../store.js').AppState} state
 * @param {{ cs: number }} scores
 * @returns {HTMLElement}
 */
export function render(state, scores) {
  const section = document.createElement('section');

  // Header
  const header = document.createElement('div');
  header.className = 'section-header';
  const title = document.createElement('h2');
  title.className = 'section-title';
  title.textContent = 'CS Subjects Tracker';
  const badge = document.createElement('div');
  badge.className = 'score-card';
  badge.style.display = 'inline-block';
  badge.innerHTML = `<div class="score-card__label">CS Score</div><div class="score-card__value">${scores.cs.toFixed(1)}%</div>`;
  header.appendChild(title);
  header.appendChild(badge);
  section.appendChild(header);

  // Add form
  const formCard = document.createElement('div');
  formCard.className = 'card mb-lg';
  formCard.innerHTML = '<h3 class="card-title">Add CS Topic</h3>';

  const form = document.createElement('form');
  form.className = 'form';
  form.setAttribute('novalidate', '');

  function makeGroup(id, labelText, inputEl, errorEl) {
    const g = document.createElement('div'); g.className = 'form-group';
    const lbl = document.createElement('label'); lbl.setAttribute('for', id); lbl.textContent = labelText;
    g.appendChild(lbl); g.appendChild(inputEl);
    if (errorEl) g.appendChild(errorEl);
    return g;
  }

  const subjectInput = document.createElement('input');
  subjectInput.type = 'text'; subjectInput.id = 'cs-subject'; subjectInput.placeholder = 'e.g. DBMS, OS';
  const subjectError = document.createElement('span'); subjectError.className = 'field-error';

  const topicInput = document.createElement('input');
  topicInput.type = 'text'; topicInput.id = 'cs-topic'; topicInput.placeholder = 'e.g. Normalisation';
  const topicError = document.createElement('span'); topicError.className = 'field-error';

  const statusSelect = document.createElement('select'); statusSelect.id = 'cs-status';
  ['not-started', 'in-progress', 'completed'].forEach(v => {
    const o = document.createElement('option'); o.value = v; o.textContent = v; statusSelect.appendChild(o);
  });

  const row = document.createElement('div'); row.className = 'form-row';
  row.appendChild(makeGroup('cs-subject', 'Subject', subjectInput, subjectError));
  row.appendChild(makeGroup('cs-topic', 'Topic', topicInput, topicError));
  row.appendChild(makeGroup('cs-status', 'Status', statusSelect, null));
  form.appendChild(row);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit'; submitBtn.className = 'btn btn-primary mt-sm';
  submitBtn.textContent = 'Add Topic';
  form.appendChild(submitBtn);

  form.addEventListener('submit', e => {
    e.preventDefault();
    subjectError.textContent = ''; subjectInput.classList.remove('error');
    topicError.textContent = ''; topicInput.classList.remove('error');

    const subRes = validateText(subjectInput.value);
    const topRes = validateText(topicInput.value);
    let hasError = false;
    if (!subRes.valid) { subjectError.textContent = subRes.error; subjectInput.classList.add('error'); hasError = true; }
    if (!topRes.valid) { topicError.textContent = topRes.error; topicInput.classList.add('error'); hasError = true; }
    if (hasError) return;

    const newEntry = {
      id: Date.now().toString(),
      subject: subjectInput.value.trim(),
      topic: topicInput.value.trim(),
      status: statusSelect.value,
    };
    const cur = Store.getState();
    Store.commit({ csEntries: [...cur.csEntries, newEntry] });
  });

  formCard.appendChild(form);
  section.appendChild(formCard);

  // Entries table
  const tableCard = document.createElement('div');
  tableCard.className = 'card';
  tableCard.innerHTML = '<h3 class="card-title">Your CS Topics</h3>';

  if (state.csEntries.length === 0) {
    const p = document.createElement('p');
    p.className = 'text-muted text-center mt-md';
    p.textContent = 'No CS topics yet. Add one above!';
    tableCard.appendChild(p);
  } else {
    const wrapper = document.createElement('div'); wrapper.className = 'table-wrapper';
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    ['Subject', 'Topic', 'Status', ''].forEach(t => {
      const th = document.createElement('th'); th.textContent = t; hr.appendChild(th);
    });
    thead.appendChild(hr); table.appendChild(thead);

    const tbody = document.createElement('tbody');
    state.csEntries.forEach(entry => {
      const tr = document.createElement('tr');

      const tdSubject = document.createElement('td'); tdSubject.textContent = entry.subject;
      const tdTopic = document.createElement('td'); tdTopic.textContent = entry.topic;

      const tdStatus = document.createElement('td');
      const sel = document.createElement('select');
      ['not-started', 'in-progress', 'completed'].forEach(v => {
        const o = document.createElement('option'); o.value = v; o.textContent = v;
        if (v === entry.status) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', () => {
        const cur = Store.getState();
        Store.commit({ csEntries: cur.csEntries.map(e => e.id === entry.id ? { ...e, status: sel.value } : e) });
      });
      tdStatus.appendChild(sel);

      const tdAction = document.createElement('td');
      const delBtn = document.createElement('button');
      delBtn.type = 'button'; delBtn.className = 'btn btn-danger btn-sm'; delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => {
        const cur = Store.getState();
        Store.commit({ csEntries: cur.csEntries.filter(e => e.id !== entry.id) });
      });
      tdAction.appendChild(delBtn);

      tr.appendChild(tdSubject); tr.appendChild(tdTopic);
      tr.appendChild(tdStatus); tr.appendChild(tdAction);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    tableCard.appendChild(wrapper);
  }

  section.appendChild(tableCard);
  return section;
}
