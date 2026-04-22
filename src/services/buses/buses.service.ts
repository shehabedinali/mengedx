// Initializes the `buses` service on path `/buses`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Buses } from './buses.class';
import createModel from '../../models/buses.model';
import hooks from './buses.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'buses': Buses & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/buses', new Buses(options, app));
  
 
  // Get our initialized service so that we can register hooks
  const service = app.service('buses');

  service.hooks(hooks);
}
