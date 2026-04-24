// booked-seats-model.ts - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
import { Application } from '../declarations';
import { Model, Mongoose } from 'mongoose';

export default function (app: Application): Model<any> {
  const modelName = 'bookedSeats';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema({
     bookedBy:{ type: mongooseClient.Schema.Types.ObjectId, ref: 'users' },
     trip: {
            type: mongooseClient.Schema.Types.ObjectId,
            ref: 'trips'
        },
    user: {
            type: mongooseClient.Schema.Types.ObjectId,
            ref: 'users'
        },
    seats: [{
            type: String
        }],
    status: {
            type: String,
            enum: ['Booked', 'Pending', 'PendingPayment', 'Driver',"SeatWithIssue"]
        },
    phoneNumber: {
            type: String
        },
    emergencyContact: {
            type: String
        },

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
