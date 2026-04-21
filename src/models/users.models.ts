import { Application } from "../declarations";
import { Model , Mongoose } from "mongoose";

export default function(app:Application):Model<any>{
    const modelName = "users";
    const mongooseClient : Mongoose = app.get("mongooseClient");
    const schema = new mongooseClient.Schema({
            //realations
            company: {
                type:mongooseClient.Schema.Types.ObjectId,
                ref:"companies"
            },
            //fileds
            firstName :{ type:String },
            lastName :{ type:String },              
            status :{ type:String, enum:['active', 'inactive'] },
            startedAt: { type: Date },
            userRole: { type: String, enum:['Admin', 'User','Ticketer',"Manager"] }

    },{
        timestamps:true
    });


    if(mongooseClient.modelNames().includes(modelName)){
       ( mongooseClient as any).deleteModel(modelName)
    }

   return mongooseClient.model<any>(modelName, schema);

}