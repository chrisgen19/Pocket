import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildLoginNext, isProtectedPath } from '../src/lib/auth-redirect';

describe('auth route guard', () => {
  it('guards saves routes only', () => {
    assert.equal(isProtectedPath('/saves'), true);
    assert.equal(isProtectedPath('/saves/folder-1'), true);
    assert.equal(isProtectedPath('/login'), false);
    assert.equal(isProtectedPath('/saves-and-searches'), false);
  });

  it('builds the login next value from the full app path', () => {
    assert.equal(buildLoginNext('/saves', ''), '/saves');
    assert.equal(buildLoginNext('/saves', '?view=favorites&sort=recent'), '/saves?view=favorites&sort=recent');
    assert.equal(buildLoginNext('/saves/folder-1', '?tag=typescript'), '/saves/folder-1?tag=typescript');
  });
});
