// DSA Tracker view
// Implementation: task 11.1
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.6

import { Store } from '../store.js';
import { validateText, validateNonNegInt } from '../utils/validation.js';
import { createElement } from '../utils/dom.js';

/**
 * Renders the DSA Tracker section.
 *
 * @param {import('../store.js').AppState} state  - Current app state (deep clone from Store)
 * @param {{ dsa: number }} scores                - Computed score object (scores.dsa is the DSA Score)
 * @returns {HTMLElement}  A <section> DOM node
 */
export function render(state, scores) {
  const section = createElement('section', { className: 'dsa-tracker' });

  // ── Section header ──────────────────────────────────────────────────
  const header = createElement('div', { className: 'section-header' });
  header.appendChild(createElement('h2', { className: 'section-title' }, 'DSA Tracker'));

  const scoreBadge = createElement(
    'div',
    { className: 'score-card', style: { display: 'inline-block', minWidth: '140px' } },
    createElement('div', { className: 'score-card__label' }, 'DSA Score'),
    createElement('div', { className: 'score-card__value' }, `${scores.dsa.toFixed(1)}%`)
  );
  header.appendChild(scoreBadge);
  section.appendChild(header);

  // ── Add entry form ───────────────────────────────────────────────────
  const formCard = createElement('div', { className: 'card mb-lg' });
  formCard.appendChild(createElement('h3', { className: 'card-title' }, 'Add DSA Entry'));

  const form = createElement('form', { className: 'form', novalidate: '' });

  // --- Topic field ---
  const topicGroup = createElement('div', { className: 'form-group' });
  const topicLabel = createElement('label', { for: 'dsa-topic' }, 'Topic');
  const topicInput = createElement('input', {
    type: 'text',
    id: 'dsa-topic',
    name: 'topic',
    placeholder: 'e.g. Binary Trees',
  });
  const topicError = createElement('span', { className: 'field-error', 'aria-live': 'polite' });
  topicGroup.appendChild(topicLabel);
  topicGroup.appendChild(topicInput);
  topicGroup.appendChild(topicError);

  // --- Solved field ---
  const solvedGroup = createElement('div', { className: 'form-group' });
  const solvedLabel = createElement('label', { for: 'dsa-solved' }, 'Questions Solved');
  const solvedInput = createElement('input', {
    type: 'number',
    id: 'dsa-solved',
    name: 'solved',
    placeholder: '0',
    min: '0',
    step: '1',
  });
  const solvedError = createElement('span', { className: 'field-error', 'aria-live': 'polite' });
  solvedGroup.appendChild(solvedLabel);
  solvedGroup.appendChild(solvedInput);
  solvedGroup.appendChild(solvedError);

  // --- Difficulty field ---
  const diffGroup = createElement('div', { className: 'form-group' });
  const diffLabel = createElement('label', { for: 'dsa-difficulty' }, 'Difficulty');
  const diffSelect = createElement('select', { id: 'dsa-difficulty', name: 'difficulty' });
  ['Easy', 'Medium', 'Hard'].forEach(level => {
    diffSelect.appendChild(createElement('option', { value: level }, level));
  });
  diffGroup.appendChild(diffLabel);
  diffGroup.appendChild(diffSelect);

  // Arrange fields in a row
  const formRow = createElement('div', { className: 'form-row' });
  formRow.appendChild(topicGroup);
  formRow.appendChild(solvedGroup);
  formRow.appendChild(diffGroup);
  form.appendChild(formRow);

  const submitBtn = createElement(
    'button',
    { type: 'submit', className: 'btn btn-primary mt-sm' },
    'Add Entry'
  );
  form.appendChild(submitBtn);

  // --- Form submit handler ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const topicVal = topicInput.value;
    const solvedVal = solvedInput.value;
    const diffVal = diffSelect.value;

    // Clear previous errors
    topicError.textContent = '';
    topicInput.classList.remove('error');
    solvedError.textContent = '';
    solvedInput.classList.remove('error');

    const topicResult = validateText(topicVal);
    const solvedResult = validateNonNegInt(solvedVal);

    let hasError = false;

    if (!topicResult.valid) {
      topicError.textContent = topicResult.error;
      topicInput.classList.add('error');
      hasError = true;
    }

    if (!solvedResult.valid) {
      solvedError.textContent = solvedResult.error;
      solvedInput.classList.add('error');
      hasError = true;
    }

    // Do NOT mutate Store on failure (Req 2.6)
    if (hasError) return;

    const newEntry = {
      id: Date.now().toString(),
      topic: topicVal.trim(),
      solved: Number(solvedVal),
      difficulty: diffVal,
      createdAt: Date.now(),
    };

    // Snapshot current state at commit time to avoid stale closure
    const currentState = Store.getState();
    Store.commit({ dsaEntries: [...currentState.dsaEntries, newEntry] });
    // (The store triggers a re-render, so we don't need to reset the form manually)
  });

  formCard.appendChild(form);
  section.appendChild(formCard);

  // ── Entries table ────────────────────────────────────────────────────
  const tableCard = createElement('div', { className: 'card' });
  tableCard.appendChild(createElement('h3', { className: 'card-title' }, 'Your Entries'));

  if (state.dsaEntries.length === 0) {
    tableCard.appendChild(
      createElement(
        'p',
        { className: 'text-muted text-center mt-md' },
        'No DSA entries yet. Add one above!'
      )
    );
  } else {
    const wrapper = createElement('div', { className: 'table-wrapper' });
    const table = createElement('table');

    // Header
    const thead = createElement('thead');
    const headerRow = createElement('tr');
    ['Topic', 'Solved', 'Difficulty', 'Added', ''].forEach(text => {
      headerRow.appendChild(createElement('th', null, text));
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = createElement('tbody');
    state.dsaEntries.forEach(entry => {
      const tr = createElement('tr');

      tr.appendChild(createElement('td', null, entry.topic));
      tr.appendChild(createElement('td', null, String(entry.solved)));
      tr.appendChild(createElement('td', null, entry.difficulty));

      const date = new Date(entry.createdAt).toLocaleDateString();
      tr.appendChild(createElement('td', { className: 'text-muted' }, date));

      const deleteBtn = createElement(
        'button',
        { type: 'button', className: 'btn btn-danger btn-sm' },
        'Delete'
      );
      deleteBtn.addEventListener('click', () => {
        const currentState = Store.getState();
        Store.commit({
          dsaEntries: currentState.dsaEntries.filter(e => e.id !== entry.id),
        });
      });

      const actionTd = createElement('td', null);
      actionTd.appendChild(deleteBtn);
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
