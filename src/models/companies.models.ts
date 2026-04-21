import { Application } from "../declarations";
import { Model, Mongoose } from "mongoose";


export default function(app: Application):Model<any>{
    const modelName = 'companies';
    const mongooseClient: Mongoose = app.get('mongooseClient');
    const schema = new mongooseClient.Schema({
        companyName:{
            type: String,
            required: true,
            unique: true
        }
    },{
        timestamps:true
    })

    if(mongooseClient.modelNames().includes(modelName)){
        (mongooseClient as any).deleteModel(modelName);
    }

    return mongooseClient.model<any>(modelName, schema);
}