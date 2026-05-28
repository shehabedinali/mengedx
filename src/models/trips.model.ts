// trips-model.ts - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
import { Application } from '../declarations';
import { Model, Mongoose } from 'mongoose';

export default function (app: Application): Model<any> {
  const modelName = 'trips';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema({
      company: {
      type: Schema.Types.ObjectId,
      ref: 'companies',
      required: true
    },

    bus: {
      type: Schema.Types.ObjectId,
      ref: 'buses',
      required: true
    },


    route: {
      type: Schema.Types.ObjectId,
      ref: 'routes',
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    departureTime: {
      type: String,
      required: true
    },
    availableSeats: {
      type: Number,
      required: true,
      min: 0
    },


    status: {
      type: String,
      enum: [
        'Planned',
        'Boarding',
        'Departed',
        'InTransit',
        'Completed',
        'Cancelled',
        'Delayed'
      ],
      default: 'Planned'
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },

    createdByRole: {
      type: String,
      enum: ['SuperAdmin', 'Admin', 'Manager', 'Ticketer'],
      required: true
    }
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
