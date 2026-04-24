import assert from 'assert';
import app from '../../src/app';

describe('\' scheduletrip\' service', () => {
  it('registered the service', () => {
    const service = app.service('scheduletrip');

    assert.ok(service, 'Registered the service');
  });
});
