import assert from 'assert';
import app from '../../src/app';

describe('\'assignSeatmaps\' service', () => {
  it('registered the service', () => {
    const service = app.service('assign-seatmaps');

    assert.ok(service, 'Registered the service');
  });
});
