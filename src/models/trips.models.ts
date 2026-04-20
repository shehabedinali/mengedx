import { Application } from "../declarations";
import {Model,Mongoose} from 'mongoose';

export default function(app:Application):Model<any>{

    const modelName = 'trips';
    const mongooseClient : Mongoose = app.get("mongooseClient");
    const schema = new mongooseClient.Schema({
        CompanyId:{
            type: mongooseClient.Schema.Types.ObjectId,
            ref:'companies'
        },
        busId:{
            type: mongooseClient.Schema.Types.ObjectId,
            ref:'buses'
        },
        routeId:{
            type: mongooseClient.Schema.Types.ObjectId,
            ref:'routes'
        },
        tripDate:{type:Date},
        TripStatus:{type:String, enum:[]},//statusses to be added
    },{timestamps:true});

    if(mongooseClient.modelNames().includes(modelName)){
        mongooseClient.deleteModel(modelName)
    }

    return mongooseClient.model<any>(modelName,schema);
}
