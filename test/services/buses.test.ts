import assert from 'assert';
import app from '../../src/app';

describe('\'buses\' service', () => {
  it('registered the service', () => {
    const service = app.service('buses');

    assert.ok(service, 'Registered the service');
  });
});
