import assert from 'assert';
import app from '../../src/app';

describe('\'booktrips\' service', () => {
  it('registered the service', () => {
    const service = app.service('booktrips');

    assert.ok(service, 'Registered the service');
  });
});
