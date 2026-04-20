import { Application } from "../declarations";
import { Model , Mongoose } from "mongoose";

export default function(app:Application):Model<any>{
    const modelName = "users";
    const mongooseClient : Mongoose = app.get("mongooseClient");
    const schema = new mongooseClient.Schema({
            //realations
            companyId: {
                type:mongooseClient.Schema.Types.ObjectId,
                ref:"companies"
            },
            //fileds
            firstName :{ type:String },
            lastName :{ type:String },              
            Status :{ type:String, enum:['active', 'inactive'] },
            StartedAt: { type: Date },
            UserRole: { type: String, enum:['admin', 'user'] }

    },{
        timestamps:true
    });


    if(mongooseClient.modelNames().includes(modelName)){
       ( mongooseClient as any).deleteModel(modelName)
    }

   return mongooseClient.model<any>(modelName, schema);

}