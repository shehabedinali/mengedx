import assert from 'assert';
import app from '../../src/app';

describe('\'TickerOffice\' service', () => {
  it('registered the service', () => {
    const service = app.service('ticker-office');

    assert.ok(service, 'Registered the service');
  });
});
