import { Id, NullableId, Paginated, Params, ServiceMethods } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { mongo } from 'mongoose';
import { BadRequest } from '@feathersjs/errors';

interface Data {
  
}


//interface to define the data that will be passed to the patch method when assigning a driver to a bus. It will contain the driver id that will be assigned to the bus.
interface AssignDriverData {
  driver : string;
  driverAssignedBy:string;
  driverAssignedAt : Date;
  status: 'Assigned' | 'Active';
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
     const assignedDriver = await this.app.service('drivers').find({driver:params?.query?.driver});
     console.log(assignedDriver)
     return assignedDriver;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get (id: Id, params?: Params): Promise<Data> {
   
    return [];
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
   
    
    //check if the bus exists
    const isAvailable = await this.app.service('buses').get(id);    
    
    const assignedBus = await this.app.service('buses').patch(id, {
      driver: data.driver,
      driverAssignedBy: data.driverAssignedBy,
      driverAssignedAt: data.driverAssignedAt,
    
    });

    console.log(data.driver , isAvailable.driver?.toString());

    const updatedDriver = await this.app.service('drivers').patch( data.driver || isAvailable.driver?.toString(), {
      status: data.status
    });

    console.log("complited")
       
    return assignedBus;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async remove (id: NullableId, params?: Params): Promise<Data> {

   
    return { id };
  }
}
