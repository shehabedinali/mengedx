
import { Application } from '../declarations';
import { Model, Mongoose } from 'mongoose';

export default function (app: Application): Model<any> {
  const modelName = 'ContactAndAddress';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const schema = new mongooseClient.Schema({
  
    userId: {
      type: mongooseClient.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    PhoneNumber: { type: String, unique: true },
    EmergencyContact: { type: String },
    EmergencyContactName: { type: String },
    City: { type: String },
    Country: { type: String }



  
  
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
