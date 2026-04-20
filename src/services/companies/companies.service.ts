// Initializes the `Companies ` service on path `/companies`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Companies } from './companies.class';
import hooks from './companies.hooks';
import createModel from "../../models/companies.models";


// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'companies': Companies & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get('paginate'),
    Model: createModel(app)
  };

  // Initialize our service with any options it requires
  app.use('/companies', new Companies(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('companies');

  service.hooks(hooks);
}
