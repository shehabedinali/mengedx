import { Id, NullableId, Paginated, Params, ServiceMethods } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { mongo } from 'mongoose';
import { BadRequest } from '@feathersjs/errors';

interface Data {
  
}


//interface to define the data that will be passed to the patch method when assigning a driver to a bus. It will contain the driver id that will be assigned to the bus.
interface AssignDriverData {
  driver : string;
  assignedby:string;
  assignedData:Date;
}

interface ServiceOptions {}

export class AssignDrivers implements ServiceMethods<Data> {
  app: Application;
  options: ServiceOptions;

  constructor (options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async find (params?: Params): Promise<Data[] | Paginated<Data>> {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get (id: Id, params?: Params): Promise<Data> {
    return {
      id, text: `A new message with ID: ${id}!`
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create (data: Data, params?: Params): Promise<Data> {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params)));
    }

    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update (id: NullableId, data: Data, params?: Params): Promise<Data> {
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async patch (id: NullableId, data: AssignDriverData, params?: Params): Promise<Data> {

    if (!id) {
      throw new BadRequest(`Path assignDriver userId not found`);
    }
   

    const bus = await this.app.service('buses').patch(id, data);
    return bus;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async remove (id: NullableId, params?: Params): Promise<Data> {

   
    return { id };
  }
}
