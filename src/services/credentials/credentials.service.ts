// Initializes the `credentials` service on path `/credentials`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Credentials } from './credentials.class';
import createModel from '../../models/credentials.model';
import hooks from './credentials.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'credentials': Credentials & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/credentials', new Credentials(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('credentials');

  service.hooks(hooks);
}
