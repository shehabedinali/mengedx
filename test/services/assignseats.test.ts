import assert from 'assert';
import app from '../../src/app';

describe('\'assignseats\' service', () => {
  it('registered the service', () => {
    const service = app.service('assignseats');

    assert.ok(service, 'Registered the service');
  });
});
