// Initializes the `trips` service on path `/trips`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Trips } from './trips.class';
import createModel from '../../models/trips.model';
import hooks from './trips.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'trips': Trips & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/trips', new Trips(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('trips');

  service.hooks(hooks);
}
