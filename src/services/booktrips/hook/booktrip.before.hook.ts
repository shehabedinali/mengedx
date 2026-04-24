import { HookContext } from "@feathersjs/feathers";

export function beforeCreateValidatorBookTrip(options:any = {}) {

    return (context : HookContext)=>{
        const {data,app,params} = context;
        if(!data.trip || !data.seats || !data.status || !data.phoneNumber || !data.emergencyContact){
            throw new Error("Path booktrip fields not found");
        }
        data.bookedBy = params?.credential?._id.toString() || null;
        return context;
    }

}