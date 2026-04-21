import assert from 'assert';
import app from '../../src/app';

describe('\'Companies \' service', () => {
  it('registered the service', () => {
    const service = app.service('companies');

    assert.ok(service, 'Registered the service');
  });
});
