// buses-model.ts - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
import { Application } from '../declarations';
import { Model, Mongoose } from 'mongoose';

export default function (app: Application): Model<any> {
  const modelName = 'buses';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema({
    seatmap: { type: mongooseClient.Schema.Types.ObjectId, ref: 'seatmap' },
    seatmapAssignedBy: { type: mongooseClient.Schema.Types.ObjectId, ref: 'users' },
    driverAssignedby:{ type: mongooseClient.Schema.Types.ObjectId, ref: 'users' },
    driverAssignedDate: { type: Date },
    seatmapAssignedDate: { type: Date },
    company: { type: mongooseClient.Schema.Types.ObjectId, ref: 'companies' },
    driver: { type: mongooseClient.Schema.Types.ObjectId, ref: 'drivers' },
    status: { type: String, enum: ['Active', 'Inactive'] ,default:'Active'},
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
