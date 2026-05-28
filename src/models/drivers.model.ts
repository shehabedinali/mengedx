// drivers-model.ts - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
import { ref } from 'process';
import { Application } from '../declarations';
import { Model, Mongoose } from 'mongoose';

export default function (app: Application): Model<any> {
  const modelName = 'drivers';
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

    phone: {
      type: String,
      required: true
    },

    nationalId: {
      type: String,
      required: true,
      trim: true
    },

  
    licenseNumber: {
      type: String,
      required: true,
      trim: true
    },

    licenseExpiry: {
      type: Date,
      required: true
    },

   status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended', 'OnLeave','Assigned'],
      default: 'Active'
    },
    totalTrips: {
      type: Number,
      default: 0,
      min: 0
    },

    totalKm: {
      type: Number,
      default: 0,
      min: 0
    },

    violations: {
      type: Number,
      default: 0,
      min: 0
    },
    
    address: {
      country: {
        type: String,
        default: 'Ethiopia'
      },
      city: {
        type: String,
        default: null
      },
      subCity: {
        type: String,
        default: null
      }
    },

    emergencyContact: {
      type:{
            name: {
                type: String,
                required: true
                  },
            phone: {
                type: String,
                required: true
                    }
      },
      default: null
    },

    avatar: {
      type: String,
      default: null
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
