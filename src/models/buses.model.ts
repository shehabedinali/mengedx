import { Application } from '../declarations';
import { Model, Mongoose } from 'mongoose';

export default function (app: Application): Model<any> {
  const modelName = 'buses';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const schema = new mongooseClient.Schema({  
    BusId: { type: mongooseClient.Schema.Types.ObjectId },
    CompanyId: { type: mongooseClient.Schema.Types.ObjectId, ref: 'companies' },
    DriverId: { type: mongooseClient.Schema.Types.ObjectId, ref: 'drivers' },
    Status: { type: String, enum: ['active', 'inactive'] },
    Capacity: { type: Number },  
  
  }, {
    timestamps: true
  });

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    (mongooseClient as any).deleteModel(modelName);
  }
  return mongooseClient.model<any>(modelName, schema);
}
