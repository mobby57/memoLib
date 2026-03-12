// Jest exposes helpers globally in setupFilesAfterEnv.
const realFetch = global.fetch ? global.fetch.bind(global) : undefined;

Object.defineProperty(global, '__REAL_FETCH__', {
  value: realFetch,
  writable: false,
  configurable: true,
});

global.fetch = jest.fn();

beforeEach(() => {
  global.fetch.mockClear();
  global.localStorage?.clear?.();
  global.sessionStorage?.clear?.();
});
