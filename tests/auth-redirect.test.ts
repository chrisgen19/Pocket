import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_AUTH_REDIRECT, sanitizeNext } from '../src/lib/auth-redirect';

describe('sanitizeNext', () => {
  it('accepts app-relative paths with query strings', () => {
    assert.equal(sanitizeNext('/saves'), '/saves');
    assert.equal(sanitizeNext('/saves?view=favorites&sort=recent'), '/saves?view=favorites&sort=recent');
    assert.equal(sanitizeNext('/saves/folder-1?tag=typescript'), '/saves/folder-1?tag=typescript');
  });

  it('falls back for missing or external targets', () => {
    for (const raw of [null, '', 'https://evil.test/saves', 'javascript:alert(1)', '//evil.test/saves']) {
      assert.equal(sanitizeNext(raw), DEFAULT_AUTH_REDIRECT);
    }
  });

  it('falls back for escape and header-injection payloads', () => {
    assert.equal(sanitizeNext('/\\evil.test\\saves'), DEFAULT_AUTH_REDIRECT);
    assert.equal(sanitizeNext('/saves\r\nLocation: //evil.test'), DEFAULT_AUTH_REDIRECT);
  });
});
