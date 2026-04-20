import assert from 'assert';
import app from '../../src/app';

describe('\'routes\' service', () => {
  it('registered the service', () => {
    const service = app.service('routes');

    assert.ok(service, 'Registered the service');
  });
});
