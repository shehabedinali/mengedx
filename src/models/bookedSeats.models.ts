import { Application } from "../declarations";
import {Model,Mongoose} from 'mongoose';

export default function(app:Application):Model<any>{

    const modelName = 'BookedSeats';
    const mongooseClient : Mongoose = app.get("mongooseClient");
    const schema = new mongooseClient.Schema({
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
        }

       
    },{timestamps:true});

    if(mongooseClient.modelNames().includes(modelName)){
        mongooseClient.deleteModel(modelName)
    }

    return mongooseClient.model<any>(modelName,schema);
}
