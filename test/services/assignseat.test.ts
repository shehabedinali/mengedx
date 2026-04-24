import assert from 'assert';
import app from '../../src/app';

describe('\'assignseat\' service', () => {
  it('registered the service', () => {
    const service = app.service('assignseat');

    assert.ok(service, 'Registered the service');
  });
});
