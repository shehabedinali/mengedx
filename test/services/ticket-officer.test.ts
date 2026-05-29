import assert from 'assert';
import app from '../../src/app';

describe('\'ticketOfficer\' service', () => {
  it('registered the service', () => {
    const service = app.service('ticket-officer');

    assert.ok(service, 'Registered the service');
  });
});
