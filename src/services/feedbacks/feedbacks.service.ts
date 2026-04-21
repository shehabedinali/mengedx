// Initializes the `feedbacks` service on path `/feedbacks`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Feedbacks } from './feedbacks.class';
import hooks from './feedbacks.hooks';

import CreateModel from '../../models/feedback.models';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'feedbacks': Feedbacks & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: CreateModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/feedbacks', new Feedbacks(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('feedbacks');

  service.hooks(hooks);
}
