// routes-model.ts - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
import { Application } from '../declarations';
import { Model, Mongoose } from 'mongoose';

export default function (app: Application): Model<any> {
  const modelName = 'routes';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },

    origin: {
      type: String,
      required: true,
      trim: true
    },

    destination: {
      type: String,
      required: true,
      trim: true
    },

    distance: {
      type: Number,
      required: true,
      min: 0
    },

    duration: {
      type: Number, // minutes
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },

    stops: {
      type: [
        {
        name: {
            type: String,
            required: true
          },

        order: {
            type: Number,
            required: true,
            min: 0
          },

       fareFromOrigin: {
            type: Number,
            required: true,
            min: 0
          }
        }
      ],
      default: []
    },

   

    totalTrips: {
      type: Number,
      default: 0,
      min: 0
    },

    company: {
      type: Schema.Types.ObjectId,
      ref: 'companies',
      default: null
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
