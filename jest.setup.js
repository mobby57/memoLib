// Jest exposes helpers globally in setupFilesAfterEnv.
require('@testing-library/jest-dom');

process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret';
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';

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

const readBlobLikeAsText = async (blobLike) => {
  if (blobLike && typeof blobLike.arrayBuffer === 'function') {
    const buffer = Buffer.from(await blobLike.arrayBuffer());
    return buffer.toString('utf-8');
  }

  if (blobLike && typeof blobLike.buffer === 'function') {
    const buffer = Buffer.from(await blobLike.buffer());
    return buffer.toString('utf-8');
  }

  if (blobLike && blobLike._buffer) {
    return Buffer.from(blobLike._buffer).toString('utf-8');
  }

  if (blobLike && Array.isArray(blobLike._parts)) {
    return blobLike._parts
      .map((part) => (typeof part === 'string' ? part : Buffer.from(part).toString('utf-8')))
      .join('');
  }

  return String(blobLike ?? '');
};

if (typeof global.Blob !== 'undefined' && typeof global.Blob.prototype.text !== 'function') {
  global.Blob.prototype.text = function () {
    return readBlobLikeAsText(this);
  };
}

if (typeof global.File !== 'undefined' && typeof global.File.prototype.text !== 'function') {
  global.File.prototype.text = function () {
    return readBlobLikeAsText(this);
  };
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
