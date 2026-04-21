import assert from 'assert';
import app from '../../src/app';

describe('\'exeptionalSeat\' service', () => {
  it('registered the service', () => {
    const service = app.service('exeptional-seat');

    assert.ok(service, 'Registered the service');
  });
});
