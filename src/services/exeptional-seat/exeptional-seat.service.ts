// Initializes the `exeptionalSeat` service on path `/exeptional-seat`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { ExeptionalSeat } from './exeptional-seat.class';
import createModel from '../../models/exeptional-seat.model';
import hooks from './exeptional-seat.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'exeptional-seat': ExeptionalSeat & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/exeptional-seat', new ExeptionalSeat(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('exeptional-seat');

  service.hooks(hooks);
}
