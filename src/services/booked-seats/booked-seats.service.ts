// Initializes the `booked-seats` service on path `/booked-seats`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { BookedSeats } from './booked-seats.class';
import createModel from '../../models/booked-seats.model';
import hooks from './booked-seats.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'booked-seats': BookedSeats & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/booked-seats', new BookedSeats(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('booked-seats');

  service.hooks(hooks);
}
