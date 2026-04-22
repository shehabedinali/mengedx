import assert from 'assert';
import app from '../../src/app';

describe('\'service124\' service', () => {
  it('registered the service', () => {
    const service = app.service('service-124');

    assert.ok(service, 'Registered the service');
  });
});
