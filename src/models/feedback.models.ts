import { Application } from "../declarations";
import {Model,Mongoose} from 'mongoose';

export default function(app:Application):Model<any>{


    const modelName = 'feedback';
    const mongooseClient : Mongoose = app.get("mongooseClient");
    const schema = new mongooseClient.Schema({
        driver:{
            type: mongooseClient.Schema.Types.ObjectId,
            ref:'drivers'
        }
        ,user:{
            type: mongooseClient.Schema.Types.ObjectId,
            ref:'users'
        },
        rating:{type:Number},
        comment:{type:String}
    },{});

    if(mongooseClient.modelNames().includes(modelName)){
        mongooseClient.deleteModel(modelName)
    }

    return mongooseClient.model<any>(modelName,schema);
}