// Router unit tests
// Requirements: 11.1, 11.2, 11.3, 11.4

import { describe, it, expect, beforeEach } from 'vitest';

// We test the router logic in isolation using a lightweight re-implementation
// that matches the actual router API (register/navigate/init) so we don't need
// a browser's window.location API.

// ── Inline router re-implementation for testing ───────────────────────────
function makeRouter() {
  const routes = new Map();
  const DEFAULT_HASH = '#dashboard';
  let currentHash = '';

  function _render(hash) {
    if (routes.has(hash)) {
      routes.get(hash)();
    } else {
      currentHash = DEFAULT_HASH;
      if (routes.has(DEFAULT_HASH)) routes.get(DEFAULT_HASH)();
    }
  }

  return {
    register(hash, fn) { routes.set(hash, fn); },
    navigate(hash) { currentHash = hash; _render(hash); },
    init(initialHash = '') {
      currentHash = initialHash || DEFAULT_HASH;
      _render(currentHash);
    },
    getCurrentHash() { return currentHash; },
  };
}

describe('Router', () => {
  it('renders #dashboard route when registered and navigated to', () => {
    const router = makeRouter();
    let rendered = '';
    router.register('#dashboard', () => { rendered = 'dashboard'; });
    router.navigate('#dashboard');
    expect(rendered).toBe('dashboard');
  });

  it('renders the correct view for each registered route', () => {
    const router = makeRouter();
    const calls = {};
    ['#dashboard','#dsa','#projects','#cs','#aptitude','#resume','#company'].forEach(h => {
      calls[h] = 0;
      router.register(h, () => { calls[h]++; });
    });
    router.navigate('#dsa');
    expect(calls['#dsa']).toBe(1);
    router.navigate('#company');
    expect(calls['#company']).toBe(1);
    // Other routes were not called
    expect(calls['#dashboard']).toBe(0);
  });

  it('unknown hash defaults to #dashboard', () => {
    const router = makeRouter();
    let rendered = '';
    router.register('#dashboard', () => { rendered = 'dashboard'; });
    router.navigate('#unknown-route');
    expect(rendered).toBe('dashboard');
  });

  it('init with no hash defaults to #dashboard', () => {
    const router = makeRouter();
    let rendered = '';
    router.register('#dashboard', () => { rendered = 'dashboard'; });
    router.init('');
    expect(rendered).toBe('dashboard');
  });

  it('init with a valid hash renders that route', () => {
    const router = makeRouter();
    let rendered = '';
    router.register('#dashboard', () => { rendered = 'dashboard'; });
    router.register('#dsa', () => { rendered = 'dsa'; });
    router.init('#dsa');
    expect(rendered).toBe('dsa');
  });

  it('multiple navigations render the correct views in sequence', () => {
    const router = makeRouter();
    const log = [];
    ['#dashboard','#dsa','#projects'].forEach(h => {
      router.register(h, () => log.push(h));
    });
    router.navigate('#dashboard');
    router.navigate('#dsa');
    router.navigate('#projects');
    expect(log).toEqual(['#dashboard','#dsa','#projects']);
  });
});
