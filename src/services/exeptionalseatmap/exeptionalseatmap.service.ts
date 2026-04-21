// Initializes the `exeptionalseatmap` service on path `/exeptionalseatmap`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Exeptionalseatmap } from './exeptionalseatmap.class';
import hooks from './exeptionalseatmap.hooks';

import CreateModel from '../../models/exeptionalSeat.models';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'exeptionalseatmap': Exeptionalseatmap & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model:CreateModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/exeptionalseatmap', new Exeptionalseatmap(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('exeptionalseatmap');

  service.hooks(hooks);
}
