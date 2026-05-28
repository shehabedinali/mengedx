// companies-model.ts - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
import { Application } from '../declarations';
import { Model, Mongoose } from 'mongoose';

export default function (app: Application): Model<any> {
  const modelName = 'companies';
  const mongooseClient: Mongoose = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const schema = new Schema(
     {
      name: {
        type: String,
        required: true,
        trim: true
    },

    code: {
      type: String,
      required: true,
      unique: true, 
      uppercase: true,
      trim: true
    },

    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true
    },

    phone: {
      type: String,
      required: false
    },

    address: {
      country: {
        type: String,
        default: 'Ethiopia'
      },
      city: {type:String,default:'Addis Ababa'},
      region: { type:String, default:'N/A'},
      street: {type:String,default:'N/A'},
    },

    logoUrl: {
      type: String,
      default: null
    },

    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended'],
      default: 'Active'
    },

    
    settings: {
      currency: {
        type: String,
        default: 'ETB'
      },
      timezone: {
        type: String,
        default: 'Africa/Addis_Ababa'
      },
      allowBooking: {
        type: Boolean,
        default: true
      }
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      default:null
    }
  },
   {
    timestamps: true
  });

  // This is necessary to avoid model compilation errors in watch mode
  // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
  if (mongooseClient.modelNames().includes(modelName)) {
    (mongooseClient as any).deleteModel(modelName);
  }
  return mongooseClient.model<any>(modelName, schema);
}
