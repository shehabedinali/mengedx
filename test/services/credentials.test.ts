import assert from 'assert';
import app from '../../src/app';

describe('\'credentials\' service', () => {
  it('registered the service', () => {
    const service = app.service('credentials');

    assert.ok(service, 'Registered the service');
  });
});
