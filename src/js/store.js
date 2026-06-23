// Central state store + localStorage persistence
// Implementation: task 3.1

const STORAGE_KEY = 'placementPrepTool_v1';

/**
 * Default application state covering all AppState fields.
 * @type {AppState}
 */
const DEFAULT_STATE = {
  dsaEntries: [],
  projectEntries: [],
  csEntries: [],
  aptitudeEntries: [],
  resume: {
    linkedIn: '',
    github: '',
    portfolio: '',
    topProjectLevel: '',
    achievements: '',
    activities: '',
  },
  cgpa: null,
  selectedCompany: null,
};

/**
 * The required top-level keys that a valid persisted state must contain.
 */
const REQUIRED_KEYS = Object.keys(DEFAULT_STATE);

/** Current in-memory state — always a full AppState. */
let _state = deepClone(DEFAULT_STATE);

/**
 * Reference to the app shell, set via Store.setApp() to avoid circular imports.
 * @type {{ renderCurrentView: () => void } | null}
 */
let _app = null;

/**
 * True when localStorage is blocked or unavailable (e.g. private browsing).
 */
let _storageUnavailable = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Produces a deep clone of a JSON-serialisable value.
 * @template T
 * @param {T} value
 * @returns {T}
 */
function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Checks that a parsed object contains all expected top-level keys.
 * @param {unknown} parsed
 * @returns {boolean}
 */
function hasRequiredKeys(parsed) {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return false;
  }
  return REQUIRED_KEYS.every((key) => Object.prototype.hasOwnProperty.call(parsed, key));
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const Store = {
  /**
   * True when localStorage is blocked or unavailable.
   * Read by the app shell to decide whether to show the storage-unavailable banner.
   */
  get storageUnavailable() {
    return _storageUnavailable;
  },

  /**
   * Provide the app reference used by commit() to trigger a re-render.
   * Called by main.js after it creates the app object to break the circular
   * dependency that would arise from a static import.
   *
   * @param {{ renderCurrentView: () => void }} appRef
   */
  setApp(appRef) {
    _app = appRef;
  },

  /**
   * Read the persisted state from localStorage and restore it into memory.
   * - Wraps all localStorage access in try/catch; sets storageUnavailable on failure.
   * - Falls back to DEFAULT_STATE if the key is absent, JSON is malformed, or
   *   any required top-level key is missing.
   * Called once during the boot sequence (main.js).
   */
  loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        // No saved data yet — start fresh.
        _state = deepClone(DEFAULT_STATE);
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        // Corrupted JSON — fall back silently.
        _state = deepClone(DEFAULT_STATE);
        return;
      }

      if (!hasRequiredKeys(parsed)) {
        // Stale or incompatible schema — fall back silently.
        _state = deepClone(DEFAULT_STATE);
        return;
      }

      _state = parsed;
    } catch {
      // localStorage is blocked (e.g. private browsing with storage disabled).
      _storageUnavailable = true;
      _state = deepClone(DEFAULT_STATE);
    }
  },

  /**
   * Returns a deep clone of the current in-memory state.
   * Callers receive a snapshot; mutations to the returned object have no effect
   * on the store.
   *
   * @returns {AppState}
   */
  getState() {
    return deepClone(_state);
  },

  /**
   * Merges `partialState` into the current state, persists to localStorage
   * synchronously, and triggers a view re-render via app.renderCurrentView().
   *
   * Persistence contract: the write happens synchronously within the same
   * event-loop tick as the user action — well within the 500 ms requirement
   * (Requirement 10.3).
   *
   * @param {Partial<AppState>} partialState
   */
  commit(partialState) {
    // Shallow-merge the patch into the current state.
    _state = Object.assign({}, _state, partialState);

    // Persist synchronously.
    if (!_storageUnavailable) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
      } catch {
        // Storage became unavailable after boot (e.g. quota exceeded).
        _storageUnavailable = true;
      }
    }

    // Trigger re-render of the currently visible view.
    if (_app && typeof _app.renderCurrentView === 'function') {
      _app.renderCurrentView();
    }
  },

  /**
   * Resets in-memory state to DEFAULT_STATE and clears the localStorage key.
   * Does not trigger a re-render — the caller is responsible for navigating
   * or re-rendering as appropriate.
   */
  clearAll() {
    _state = deepClone(DEFAULT_STATE);

    if (!_storageUnavailable) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        _storageUnavailable = true;
      }
    }

    if (_app && typeof _app.renderCurrentView === 'function') {
      _app.renderCurrentView();
    }
  },

  /**
   * Replace the entire state with an imported snapshot after validation.
   * @param {unknown} data
   * @returns {{ ok: boolean, error?: string }}
   */
  importState(data) {
    if (!hasRequiredKeys(data)) {
      return { ok: false, error: 'Invalid backup file — missing required data fields.' };
    }

    _state = deepClone(data);

    if (!_storageUnavailable) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
      } catch {
        _storageUnavailable = true;
      }
    }

    if (_app && typeof _app.renderCurrentView === 'function') {
      _app.renderCurrentView();
    }

    return { ok: true };
  },
};
