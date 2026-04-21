import { Application } from "../declarations";
import {Model,Mongoose} from 'mongoose';

export default function(app:Application):Model<any>{

    const modelName = 'exeptionalseatmaps';
    const mongooseClient : Mongoose = app.get("mongooseClient");
    const schema = new mongooseClient.Schema({
        bus: {
            type: mongooseClient.Schema.Types.ObjectId,
            ref:'buses'
        },
        SeatWithExeption:{
            type:Array.of({
                seatTage:{type :String},
                exeptionSeatsOrder:{type:Number},
            }),
        }
       
       
    },{timestamps:true});

    if(mongooseClient.modelNames().includes(modelName)){
        mongooseClient.deleteModel(modelName)
    }

    return mongooseClient.model<any>(modelName,schema);
}
