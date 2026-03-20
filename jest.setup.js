// Jest exposes helpers globally in setupFilesAfterEnv.

// Variables d'environnement requises par les tests
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret';
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
const realFetch = global.fetch ? global.fetch.bind(global) : undefined;

if (typeof global.TextEncoder === 'undefined' || typeof global.TextDecoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

if (typeof global.ReadableStream === 'undefined' || typeof global.TransformStream === 'undefined') {
  const { ReadableStream, TransformStream } = require('stream/web');
  global.ReadableStream = ReadableStream;
  global.TransformStream = TransformStream;
}

if (typeof global.MessageChannel === 'undefined' || typeof global.MessagePort === 'undefined') {
  const { MessageChannel, MessagePort } = require('worker_threads');
  global.MessageChannel = MessageChannel;
  global.MessagePort = MessagePort;
}

if (typeof global.Request === 'undefined') {
  const { Request, Response, Headers } = require('undici');
  global.Request = Request;
  global.Response = Response;
  global.Headers = Headers;
}

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
