// Settings view — data backup, restore, and reset

import { Store } from '../store.js';
import { createElement } from '../utils/dom.js';
import { toggleTheme, getTheme } from '../utils/theme.js';

/**
 * @param {import('../store.js').AppState} state
 * @param {object} _scores
 * @returns {HTMLElement}
 */
export function render(state, _scores) {
  const section = createElement('section', { className: 'settings-view' });

  const header = createElement('div', { className: 'section-header' });
  header.appendChild(createElement('h2', { className: 'section-title' }, 'Settings'));
  section.appendChild(header);

  // ── Appearance ──────────────────────────────────────────────────────────
  const appearanceCard = createElement('div', { className: 'card mb-lg' });
  appearanceCard.appendChild(createElement('h3', { className: 'card-title' }, 'Appearance'));

  const themeRow = createElement('div', { className: 'settings-row' });
  themeRow.appendChild(
    createElement('div', { className: 'settings-row__info' },
      createElement('strong', null, 'Theme'),
      createElement('p', { className: 'text-muted' }, `Currently using ${getTheme()} mode.`)
    )
  );

  const themeBtn = createElement('button', {
    type: 'button',
    className: 'btn btn-secondary',
    onClick: toggleTheme,
  }, getTheme() === 'dark' ? '☀️ Switch to Light' : '🌙 Switch to Dark');
  themeRow.appendChild(themeBtn);
  appearanceCard.appendChild(themeRow);
  section.appendChild(appearanceCard);

  // ── Data management ─────────────────────────────────────────────────────
  const dataCard = createElement('div', { className: 'card mb-lg' });
  dataCard.appendChild(createElement('h3', { className: 'card-title' }, 'Data Management'));

  const statusMsg = createElement('p', { className: 'settings-status', 'aria-live': 'polite' });
  dataCard.appendChild(statusMsg);

  function showStatus(text, type = 'info') {
    statusMsg.textContent = text;
    statusMsg.className = `settings-status settings-status--${type}`;
  }

  // Export
  const exportRow = createElement('div', { className: 'settings-row' });
  exportRow.appendChild(
    createElement('div', { className: 'settings-row__info' },
      createElement('strong', null, 'Export Data'),
      createElement('p', { className: 'text-muted' }, 'Download a JSON backup of all your prep data.')
    )
  );
  const exportBtn = createElement('button', {
    type: 'button',
    className: 'btn btn-primary',
    onClick: () => {
      const snapshot = Store.getState();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `placement-prep-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showStatus('Backup downloaded successfully.', 'success');
    },
  }, 'Export JSON');
  exportRow.appendChild(exportBtn);
  dataCard.appendChild(exportRow);

  // Import
  const importRow = createElement('div', { className: 'settings-row' });
  importRow.appendChild(
    createElement('div', { className: 'settings-row__info' },
      createElement('strong', null, 'Import Data'),
      createElement('p', { className: 'text-muted' }, 'Restore from a previously exported JSON backup.')
    )
  );

  const fileInput = createElement('input', {
    type: 'file',
    accept: 'application/json,.json',
    className: 'sr-only',
    id: 'import-file',
  });
  const importBtn = createElement('button', {
    type: 'button',
    className: 'btn btn-secondary',
    onClick: () => fileInput.click(),
  }, 'Import JSON');

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const result = Store.importState(parsed);
        if (result.ok) {
          showStatus('Data imported successfully!', 'success');
        } else {
          showStatus(result.error || 'Import failed.', 'error');
        }
      } catch {
        showStatus('Could not parse the file — make sure it is valid JSON.', 'error');
      }
      fileInput.value = '';
    };
    reader.readAsText(file);
  });

  importRow.appendChild(fileInput);
  importRow.appendChild(importBtn);
  dataCard.appendChild(importRow);

  // Clear all
  const clearRow = createElement('div', { className: 'settings-row settings-row--danger' });
  clearRow.appendChild(
    createElement('div', { className: 'settings-row__info' },
      createElement('strong', null, 'Clear All Data'),
      createElement('p', { className: 'text-muted' }, 'Permanently delete all entries and reset to defaults.')
    )
  );
  const clearBtn = createElement('button', {
    type: 'button',
    className: 'btn btn-danger',
    onClick: () => {
      if (window.confirm('Delete ALL prep data? This cannot be undone.')) {
        Store.clearAll();
        showStatus('All data has been cleared.', 'success');
      }
    },
  }, 'Clear All');
  clearRow.appendChild(clearBtn);
  dataCard.appendChild(clearRow);

  section.appendChild(dataCard);

  // ── Summary ───────────────────────────────────────────────────────────
  const summaryCard = createElement('div', { className: 'card' });
  summaryCard.appendChild(createElement('h3', { className: 'card-title' }, 'Data Summary'));

  const summaryList = createElement('ul', { className: 'summary-list' });
  const items = [
    ['DSA entries', state.dsaEntries.length],
    ['Projects', state.projectEntries.length],
    ['CS topics', state.csEntries.length],
    ['Aptitude sessions', state.aptitudeEntries.length],
    ['CGPA', state.cgpa !== null ? String(state.cgpa) : 'Not set'],
    ['Target company', state.selectedCompany || 'None'],
  ];
  for (const [label, value] of items) {
    summaryList.appendChild(
      createElement('li', { className: 'summary-list__item' },
        createElement('span', null, label),
        createElement('strong', null, String(value))
      )
    );
  }
  summaryCard.appendChild(summaryList);
  section.appendChild(summaryCard);

  return section;
}
