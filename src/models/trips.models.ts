import { Application } from "../declarations";
import {Model,Mongoose} from 'mongoose';

export default function(app:Application):Model<any>{

    const modelName = 'trips';
    const mongooseClient : Mongoose = app.get("mongooseClient");
    const schema = new mongooseClient.Schema({
        bus:{
            type: mongooseClient.Schema.Types.ObjectId,
            ref:'buses'
        },
        route:{
            type: mongooseClient.Schema.Types.ObjectId,
            ref:'routes'
        },
        departureTime:{type:Date},
        tripDate:{type:Date},
        tripStatus:{type:String, enum:['Completed','Cancelled','Inprogress']},//statusses to be added
    },{timestamps:true});

    if(mongooseClient.modelNames().includes(modelName)){
        mongooseClient.deleteModel(modelName)
    }

    return mongooseClient.model<any>(modelName,schema);
}
