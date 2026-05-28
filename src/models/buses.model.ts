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
    company: {
      type: Schema.Types.ObjectId,
      ref: 'companies',
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    plateNumber: {
      type: String,
      required: true
    },

    capacity: {
      type: Number,
      required: true,
      min: 1
    },

  

    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Maintenance', 'Retired','Assigned'],
      default: 'active'
    },

    driver: {
      type: Schema.Types.ObjectId,
      ref: 'drivers',
      default: null
    },

    driverAssignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      default: null
    },

    driverAssignedAt: {
      type: Date,
      default: null
    }, 

    lastMaintenanceDate: {
      type: Date,
      default: null
    },  

    insuranceExpiry: {
      type: Date,
      default: null
    },

    registrationExpiry: {
      type: Date,
      default: null
    },    
    seatMap: {
      type: Schema.Types.ObjectId,
      ref: 'seatmap',
      default: null
    },
    seatMapAssignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      default: null
    },
    seatMapAssignedAt: {
      type: Date,
      default: null
    },    
    lastTrip: { type: String },
    
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
