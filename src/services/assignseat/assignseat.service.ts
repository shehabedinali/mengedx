// Initializes the `assignseat` service on path `/assignseat`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Assignseat } from './assignseat.class';
import hooks from './assignseat.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'assignseat': Assignseat & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/assignseat', new Assignseat(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('assignseat');

  service.hooks(hooks);
}
