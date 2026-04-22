import assert from 'assert';
import app from '../../src/app';

describe('\'customeBuses\' service', () => {
  it('registered the service', () => {
    const service = app.service('custome-buses');

    assert.ok(service, 'Registered the service');
  });
});
