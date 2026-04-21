import assert from 'assert';
import app from '../../src/app';

describe('\'feedbacks\' service', () => {
  it('registered the service', () => {
    const service = app.service('feedbacks');

    assert.ok(service, 'Registered the service');
  });
});
