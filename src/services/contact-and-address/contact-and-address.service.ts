// Initializes the `contactAndAddress` service on path `/contact-and-address`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { ContactAndAddress } from './contact-and-address.class';
import createModel from '../../models/contact-and-address.model';
import hooks from './contact-and-address.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'contact-and-address': ContactAndAddress & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/contact-and-address', new ContactAndAddress(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('contact-and-address');

  service.hooks(hooks);
}
