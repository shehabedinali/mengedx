import { Application } from "@feathersjs/express";
import { Model, Mongoose } from "mongoose";

export default function(app:Application):Model<any>{
    const modelName = 'drivers'

    const mongooseClient: Mongoose = app.get('mongooseClient');
    const schema = new mongooseClient.Schema({
        dirver:{
            type: mongooseClient.Schema.Types.ObjectId,
            ref:'users',
            required:true,
            unique:true
        },
        licenceNumber:{
            type:String,
            require:true,
            unique:true
        },
        licenceExpiry:{
            type:Date,
        }

    },{timestamps:true})

    if(mongooseClient.modelNames().includes(modelName)){
       ( mongooseClient as any).deleteModel(modelName)
    }

    return mongooseClient.model<any>(modelName, schema);
}