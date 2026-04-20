import { Application } from "../declarations";
import {Model, Mongoose} from 'mongoose';

export default function(app:Application) : Model<any>{
    const modelName = 'routes';
    const mongooseClient : Mongoose = app.get('mongooseClient');
    const schema = new mongooseClient.Schema({

        companyId: {type: mongooseClient.Schema.Types.ObjectId, ref:'companies'},
        routeName:{type:String},
        status:{type:String,enum:["Active","Inactive"]},
        origin:{type:String},
        destination:{type:[String]},
        distance:{type:String},
        duration:{type:String},
        fare:{type:Number}
    },{ timestamps: true});

    if(mongooseClient.modelNames().includes(modelName)){
        (mongooseClient as any).deleteModel(modelName);
    }

    return mongooseClient.model<any>(modelName, schema);
}