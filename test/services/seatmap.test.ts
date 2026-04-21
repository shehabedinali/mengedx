import assert from 'assert';
import app from '../../src/app';

describe('\'seatmap\' service', () => {
  it('registered the service', () => {
    const service = app.service('seatmap');

    assert.ok(service, 'Registered the service');
  });
});
