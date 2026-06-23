// Hash-based view router
// Implementation: task 8.1

/**
 * Router — maps location.hash values to render functions.
 *
 * Usage:
 *   Router.register('#dashboard', () => { ... });
 *   Router.init();          // attaches hashchange listener, renders initial view
 *   Router.navigate('#dsa'); // sets location.hash and triggers render
 */
const Router = (() => {
  /** @type {Map<string, Function>} */
  const routes = new Map();

  const DEFAULT_HASH = '#dashboard';

  /**
   * Render the view that matches the given hash.
   * Falls back to DEFAULT_HASH when the hash is unregistered.
   * @param {string} hash
   */
  function _render(hash) {
    const renderFn = routes.get(hash);
    if (renderFn) {
      renderFn();
    } else {
      // Unknown route — silently redirect to the default
      window.location.hash = DEFAULT_HASH;
      // The resulting hashchange event will trigger _render('#dashboard')
    }
  }

  /**
   * Register a route.
   * @param {string}   hash     - e.g. '#dashboard'
   * @param {Function} renderFn - called with no arguments when the route is active
   */
  function register(hash, renderFn) {
    routes.set(hash, renderFn);
  }

  /**
   * Programmatically navigate to a hash.
   * Sets location.hash, which fires a hashchange event and triggers the render cycle.
   * @param {string} hash - e.g. '#dsa'
   */
  function navigate(hash) {
    if (window.location.hash === hash) {
      // Already on this hash; hashchange won't fire — render manually.
      _render(hash);
    } else {
      window.location.hash = hash;
    }
  }

  /**
   * Attach the hashchange listener and render the initial view.
   * Must be called once during application boot, after all routes are registered.
   */
  function init() {
    window.addEventListener('hashchange', () => {
      _render(window.location.hash);
    });

    // Render the view for the current hash on first load.
    const initialHash = window.location.hash || DEFAULT_HASH;
    _render(initialHash);
  }

  return { register, navigate, init };
})();

export { Router };
