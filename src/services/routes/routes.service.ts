// Initializes the `routes` service on path `/routes`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Routes } from './routes.class';
import hooks from './routes.hooks';
import CreateModel from '../../models/routes.model';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'routes': Routes & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get('paginate'),
    Model: CreateModel(app)
  };

  // Initialize our service with any options it requires
  app.use('/routes', new Routes(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('routes');
  service.hooks(hooks);
}
