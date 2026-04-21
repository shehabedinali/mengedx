// Initializes the `drivers` service on path `/drivers`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Drivers } from './drivers.class';
import hooks from './drivers.hooks';
import createModel from '../../models/drivers.models';
import { Model } from 'mongoose';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'drivers': Drivers & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model :createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/drivers', new Drivers(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('drivers');

  service.hooks(hooks);
}
