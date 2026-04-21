import assert from 'assert';
import app from '../../src/app';

describe('\'booked-seats\' service', () => {
  it('registered the service', () => {
    const service = app.service('booked-seats');

    assert.ok(service, 'Registered the service');
  });
});
