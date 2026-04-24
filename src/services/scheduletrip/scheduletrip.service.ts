// Initializes the ` scheduletrip` service on path `/scheduletrip`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { Scheduletrip } from './scheduletrip.class';
import hooks from './scheduletrip.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'scheduletrip': Scheduletrip & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/scheduletrip', new Scheduletrip(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('scheduletrip');

  service.hooks(hooks);
}
