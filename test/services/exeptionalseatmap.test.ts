import assert from 'assert';
import app from '../../src/app';

describe('\'exeptionalseatmap\' service', () => {
  it('registered the service', () => {
    const service = app.service('exeptionalseatmap');

    assert.ok(service, 'Registered the service');
  });
});
