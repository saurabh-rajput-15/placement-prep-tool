// Projects Tracker view
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7

import { Store } from '../store.js';
import { validateText, warnURL } from '../utils/validation.js';

/**
 * @param {import('../store.js').AppState} state
 * @param {{ projects: number }} scores
 * @returns {HTMLElement}
 */
export function render(state, scores) {
  const section = document.createElement('section');

  // Header
  const header = document.createElement('div');
  header.className = 'section-header';
  const title = document.createElement('h2');
  title.className = 'section-title';
  title.textContent = 'Projects Tracker';
  const badge = document.createElement('div');
  badge.className = 'score-card';
  badge.style.display = 'inline-block';
  badge.innerHTML = `<div class="score-card__label">Projects Score</div><div class="score-card__value">${scores.projects.toFixed(1)}%</div>`;
  header.appendChild(title);
  header.appendChild(badge);
  section.appendChild(header);

  // Add form
  const formCard = document.createElement('div');
  formCard.className = 'card mb-lg';
  formCard.innerHTML = '<h3 class="card-title">Add Project</h3>';

  const form = document.createElement('form');
  form.className = 'form';
  form.setAttribute('novalidate', '');

  function makeGroup(id, labelText, inputEl, errorEl) {
    const g = document.createElement('div');
    g.className = 'form-group';
    const lbl = document.createElement('label');
    lbl.setAttribute('for', id);
    lbl.textContent = labelText;
    g.appendChild(lbl);
    g.appendChild(inputEl);
    if (errorEl) g.appendChild(errorEl);
    return g;
  }

  function makeInput(id, type, placeholder) {
    const el = document.createElement('input');
    el.type = type; el.id = id; el.placeholder = placeholder || '';
    return el;
  }

  function makeSelect(id, options) {
    const sel = document.createElement('select');
    sel.id = id;
    options.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o; opt.textContent = o;
      sel.appendChild(opt);
    });
    return sel;
  }

  function makeError() {
    const s = document.createElement('span');
    s.className = 'field-error';
    return s;
  }

  function makeWarn() {
    const s = document.createElement('span');
    s.className = 'field-warn';
    return s;
  }

  const nameInput = makeInput('proj-name', 'text', 'Project name');
  const nameError = makeError();
  const diffSelect = makeSelect('proj-diff', ['Basic', 'Intermediate', 'High Level']);
  const githubInput = makeInput('proj-github', 'text', 'https://github.com/...');
  const githubWarn = makeWarn();
  const liveInput = makeInput('proj-live', 'text', 'https://...');
  const liveWarn = makeWarn();
  const techInput = makeInput('proj-tech', 'text', 'e.g. React, Node.js');
  const statusSelect = makeSelect('proj-status', ['Planned', 'In Progress', 'Completed']);

  const row1 = document.createElement('div'); row1.className = 'form-row';
  row1.appendChild(makeGroup('proj-name', 'Project Name', nameInput, nameError));
  row1.appendChild(makeGroup('proj-diff', 'Difficulty', diffSelect, null));
  row1.appendChild(makeGroup('proj-status', 'Status', statusSelect, null));
  form.appendChild(row1);

  const row2 = document.createElement('div'); row2.className = 'form-row';
  const githubGroup = makeGroup('proj-github', 'GitHub Link', githubInput, githubWarn);
  const liveGroup = makeGroup('proj-live', 'Live Link', liveInput, liveWarn);
  row2.appendChild(githubGroup);
  row2.appendChild(liveGroup);
  row2.appendChild(makeGroup('proj-tech', 'Tech Stack', techInput, null));
  form.appendChild(row2);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit'; submitBtn.className = 'btn btn-primary mt-sm';
  submitBtn.textContent = 'Add Project';
  form.appendChild(submitBtn);

  form.addEventListener('submit', e => {
    e.preventDefault();
    nameError.textContent = '';
    nameInput.classList.remove('error');
    githubWarn.textContent = '';
    liveWarn.textContent = '';

    const nameVal = nameInput.value;
    const nameResult = validateText(nameVal);
    if (!nameResult.valid) {
      nameError.textContent = nameResult.error;
      nameInput.classList.add('error');
      return;
    }

    const gWarn = warnURL(githubInput.value);
    if (gWarn.warn) githubWarn.textContent = gWarn.message;
    const lWarn = warnURL(liveInput.value);
    if (lWarn.warn) liveWarn.textContent = lWarn.message;

    const newEntry = {
      id: Date.now().toString(),
      name: nameVal.trim(),
      difficulty: diffSelect.value,
      githubLink: githubInput.value,
      liveLink: liveInput.value,
      techStack: techInput.value,
      status: statusSelect.value,
      createdAt: Date.now(),
    };
    const cur = Store.getState();
    Store.commit({ projectEntries: [...cur.projectEntries, newEntry] });
  });

  formCard.appendChild(form);
  section.appendChild(formCard);

  // Entries table
  const tableCard = document.createElement('div');
  tableCard.className = 'card';
  tableCard.innerHTML = '<h3 class="card-title">Your Projects</h3>';

  if (state.projectEntries.length === 0) {
    const p = document.createElement('p');
    p.className = 'text-muted text-center mt-md';
    p.textContent = 'No projects yet. Add one above!';
    tableCard.appendChild(p);
  } else {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    ['Name', 'Difficulty', 'Status', 'Tech Stack', 'GitHub', 'Live', ''].forEach(t => {
      const th = document.createElement('th'); th.textContent = t; hr.appendChild(th);
    });
    thead.appendChild(hr); table.appendChild(thead);

    const tbody = document.createElement('tbody');
    state.projectEntries.forEach(entry => {
      const tr = document.createElement('tr');

      function td(text) {
        const cell = document.createElement('td');
        cell.textContent = text;
        return cell;
      }

      tr.appendChild(td(entry.name));
      tr.appendChild(td(entry.difficulty));
      tr.appendChild(td(entry.status));
      tr.appendChild(td(entry.techStack));

      const ghTd = document.createElement('td');
      if (entry.githubLink) {
        const a = document.createElement('a');
        a.href = entry.githubLink; a.textContent = 'Link'; a.target = '_blank';
        ghTd.appendChild(a);
      }
      tr.appendChild(ghTd);

      const liveTd = document.createElement('td');
      if (entry.liveLink) {
        const a = document.createElement('a');
        a.href = entry.liveLink; a.textContent = 'Link'; a.target = '_blank';
        liveTd.appendChild(a);
      }
      tr.appendChild(liveTd);

      const actionsTd = document.createElement('td');
      actionsTd.style.display = 'flex'; actionsTd.style.gap = '4px';

      const editBtn = document.createElement('button');
      editBtn.type = 'button'; editBtn.className = 'btn btn-secondary btn-sm';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => {
        // Replace row with inline edit form
        const editRow = document.createElement('tr');
        const editTd = document.createElement('td');
        editTd.colSpan = 7;

        const ef = document.createElement('form');
        ef.className = 'form';
        ef.style.padding = '8px 0';

        function eInput(val, placeholder) {
          const i = document.createElement('input');
          i.type = 'text'; i.value = val; i.placeholder = placeholder;
          i.style.marginRight = '8px';
          return i;
        }

        function eSelect(opts, current) {
          const s = document.createElement('select');
          s.style.marginRight = '8px';
          opts.forEach(o => {
            const op = document.createElement('option');
            op.value = o; op.textContent = o;
            if (o === current) op.selected = true;
            s.appendChild(op);
          });
          return s;
        }

        const eName = eInput(entry.name, 'Name');
        const eDiff = eSelect(['Basic', 'Intermediate', 'High Level'], entry.difficulty);
        const eStatus = eSelect(['Planned', 'In Progress', 'Completed'], entry.status);
        const eTech = eInput(entry.techStack, 'Tech Stack');
        const eGithub = eInput(entry.githubLink, 'GitHub');
        const eLive = eInput(entry.liveLink, 'Live');

        const eRow = document.createElement('div'); eRow.className = 'form-row';
        [eName, eDiff, eStatus, eTech, eGithub, eLive].forEach(el => eRow.appendChild(el));
        ef.appendChild(eRow);

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button'; saveBtn.className = 'btn btn-primary btn-sm mt-sm';
        saveBtn.textContent = 'Save';
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button'; cancelBtn.className = 'btn btn-secondary btn-sm mt-sm';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.marginLeft = '8px';

        saveBtn.addEventListener('click', () => {
          const nameRes = validateText(eName.value);
          if (!nameRes.valid) { eName.classList.add('error'); return; }
          const updated = {
            ...entry,
            name: eName.value.trim(),
            difficulty: eDiff.value,
            status: eStatus.value,
            techStack: eTech.value,
            githubLink: eGithub.value,
            liveLink: eLive.value,
          };
          const cur2 = Store.getState();
          Store.commit({ projectEntries: cur2.projectEntries.map(p => p.id === entry.id ? updated : p) });
        });
        cancelBtn.addEventListener('click', () => { tbody.replaceChild(tr, editRow); });

        ef.appendChild(saveBtn); ef.appendChild(cancelBtn);
        editTd.appendChild(ef);
        editRow.appendChild(editTd);
        tbody.replaceChild(editRow, tr);
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button'; delBtn.className = 'btn btn-danger btn-sm';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => {
        const cur2 = Store.getState();
        Store.commit({ projectEntries: cur2.projectEntries.filter(p => p.id !== entry.id) });
      });

      actionsTd.appendChild(editBtn);
      actionsTd.appendChild(delBtn);
      tr.appendChild(actionsTd);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    tableCard.appendChild(wrapper);
  }

  section.appendChild(tableCard);
  return section;
}
