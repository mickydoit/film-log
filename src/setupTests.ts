import '@testing-library/jest-dom/vitest';

// Node 22+ ships its own global `localStorage` (Web Storage API, gated on
// --localstorage-file) that shadows jsdom's implementation in this test
// environment, and is non-functional without that flag (no .clear(), etc).
// Replace it with a plain in-memory implementation so ordinary
// `localStorage.getItem/setItem/clear` calls in tests and app code work.
function createLocalStorageMock(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length; },
  } as Storage;
}

const localStorageMock = createLocalStorageMock();
for (const target of [globalThis, typeof window !== 'undefined' ? window : undefined]) {
  if (!target) continue;
  Object.defineProperty(target, 'localStorage', {
    value: localStorageMock,
    configurable: true,
    writable: true,
  });
}
