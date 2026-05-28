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
   bookedBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },

    trip: {
      type: Schema.Types.ObjectId,
      ref: 'trips',
      required: true
    },

    
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      default: null
    },

    seats: [
      {
        type: String,
        required: true
      }
    ],

    status: {
      type: String,
      enum: ['Booked', 'Pending', 'PendingPayment', 'Driver', 'SeatWithIssue', 'Cancelled'],
      default: 'Pending'
    },

    phoneNumber: {
      type: String,
      required: true
    },

    emergencyContact: {
      name: {
        type: String,
        default: null
      },

      phoneNumber: {
        type: String,
        default: null
      }
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    paymentStatus: {
      type: String,
      enum: ['Unpaid', 'Partial', 'Paid', 'Refunded'],
      default: 'Unpaid'
    },

    paymentMethod: {
      type: String,
      enum: ['Cash',  'MobileMoney', 'BankTransfer', null],
      default: null
    },


    cancelledAt: {
      type: Date,
      default: null
    },

    cancelReason: {
      type: String,
      default: null
    },

    refundedAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    expiresAt: {
      type: Date,
      default: null
    },

    confirmedAt: {
      type: Date,
      default: null
    },

    checkedInAt: {
      type: Date,
      default: null
    },

    createdByRole: {
      type: String,
      enum: ['SuperAdmin', 'Admin', 'Manager', 'Ticketer', 'Customer'],
      default: 'Customer'
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
