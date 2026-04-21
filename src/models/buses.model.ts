import { Application } from '../declarations';
import { Model, Mongoose } from 'mongoose';

export default function (app: Application): Model<any> {
  const modelName = 'buses';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const schema = new mongooseClient.Schema({  
    bus: { type: mongooseClient.Schema.Types.ObjectId },
    company: { type: mongooseClient.Schema.Types.ObjectId, ref: 'companies' },
    driver: { type: mongooseClient.Schema.Types.ObjectId, ref: 'drivers' },
    status: { type: String, enum: ['Active', 'Inactive'] },
    capacity: { type: Number },  
  
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
