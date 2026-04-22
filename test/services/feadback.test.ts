import assert from 'assert';
import app from '../../src/app';

describe('\'feadback\' service', () => {
  it('registered the service', () => {
    const service = app.service('feadback');

    assert.ok(service, 'Registered the service');
  });
});
