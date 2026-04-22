// Initializes the `assignDrivers` service on path `/y`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { AssignDrivers } from './assign-drivers.class';
import hooks from './assign-drivers.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'assign-drivers': AssignDrivers & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/assign-drivers', new AssignDrivers(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('assign-drivers');

  service.hooks(hooks);
}
