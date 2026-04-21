import assert from 'assert';
import app from '../../src/app';

describe('\'contactAndAddress\' service', () => {
  it('registered the service', () => {
    const service = app.service('contact-and-address');

    assert.ok(service, 'Registered the service');
  });
});
