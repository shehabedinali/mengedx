// Initializes the `seatmap` service on path `/seatmap`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Seatmap } from './seatmap.class';
import hooks from './seatmap.hooks';
import { Model } from 'mongoose';
import CreateModel from '../../models/seatMap.model';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'seatmap': Seatmap & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model:CreateModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/seatmap', new Seatmap(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('seatmap');

  service.hooks(hooks);
}
