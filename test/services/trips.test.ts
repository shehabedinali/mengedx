import assert from 'assert';
import app from '../../src/app';

describe('\'trips\' service', () => {
  it('registered the service', () => {
    const service = app.service('trips');

    assert.ok(service, 'Registered the service');
  });
});
