// Entry point: boots app, registers hash router

import { Store } from './store.js';
import { Router } from './router.js';
import { computeAllScores } from './scoreEngine.js';
import { initTheme, createThemeToggleButton } from './utils/theme.js';

import * as DashboardView from './views/dashboard.js';
import * as DSATrackerView from './views/dsaTracker.js';
import * as ProjectsTrackerView from './views/projectsTracker.js';
import * as CSTrackerView from './views/csTracker.js';
import * as AptitudeTrackerView from './views/aptitudeTracker.js';
import * as ResumeTrackerView from './views/resumeTracker.js';
import * as CompanySimulatorView from './views/companySimulatorView.js';
import * as SettingsView from './views/settingsView.js';

function callRender(viewModule, label, state, scores) {
  if (typeof viewModule.render === 'function') {
    return viewModule.render(state, scores);
  }
  const section = document.createElement('section');
  section.innerHTML = `<h2>${label}</h2><p>This section is coming soon.</p>`;
  return section;
}

function mountView(node) {
  const root = document.getElementById('view-root');
  if (!root) return;
  root.innerHTML = '';
  root.appendChild(node);
}

function updateActiveNavLink() {
  const currentHash = window.location.hash || '#dashboard';
  document.querySelectorAll('#main-nav .nav-link, #main-nav .nav-brand').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentHash) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

function renderDashboard() {
  const state = Store.getState();
  const scores = computeAllScores(state);
  updateActiveNavLink();
  mountView(callRender(DashboardView, 'Dashboard', state, scores));
}

function renderDSA() {
  const state = Store.getState();
  const scores = computeAllScores(state);
  updateActiveNavLink();
  mountView(callRender(DSATrackerView, 'DSA Tracker', state, scores));
}

function renderProjects() {
  const state = Store.getState();
  const scores = computeAllScores(state);
  updateActiveNavLink();
  mountView(callRender(ProjectsTrackerView, 'Projects Tracker', state, scores));
}

function renderCS() {
  const state = Store.getState();
  const scores = computeAllScores(state);
  updateActiveNavLink();
  mountView(callRender(CSTrackerView, 'CS Subjects Tracker', state, scores));
}

function renderAptitude() {
  const state = Store.getState();
  const scores = computeAllScores(state);
  updateActiveNavLink();
  mountView(callRender(AptitudeTrackerView, 'Aptitude Tracker', state, scores));
}

function renderResume() {
  const state = Store.getState();
  const scores = computeAllScores(state);
  updateActiveNavLink();
  mountView(callRender(ResumeTrackerView, 'Resume Tracker', state, scores));
}

function renderCompany() {
  const state = Store.getState();
  const scores = computeAllScores(state);
  updateActiveNavLink();
  mountView(callRender(CompanySimulatorView, 'Company Simulator', state, scores));
}

function renderSettings() {
  const state = Store.getState();
  const scores = computeAllScores(state);
  updateActiveNavLink();
  mountView(callRender(SettingsView, 'Settings', state, scores));
}

// Boot
initTheme();

const navActions = document.getElementById('nav-actions');
if (navActions) {
  navActions.appendChild(createThemeToggleButton());
}

Store.loadFromStorage();

if (Store.storageUnavailable) {
  const banner = document.getElementById('storage-banner');
  if (banner) banner.hidden = false;
}

Router.register('#dashboard', renderDashboard);
Router.register('#dsa', renderDSA);
Router.register('#projects', renderProjects);
Router.register('#cs', renderCS);
Router.register('#aptitude', renderAptitude);
Router.register('#resume', renderResume);
Router.register('#company', renderCompany);
Router.register('#settings', renderSettings);

const routeMap = {
  '#dashboard': renderDashboard,
  '#dsa': renderDSA,
  '#projects': renderProjects,
  '#cs': renderCS,
  '#aptitude': renderAptitude,
  '#resume': renderResume,
  '#company': renderCompany,
  '#settings': renderSettings,
};

const app = {
  renderCurrentView() {
    const hash = window.location.hash || '#dashboard';
    const fn = routeMap[hash];
    if (fn) fn();
    else renderDashboard();
  },
};

Store.setApp(app);
Router.init();

export { app };
