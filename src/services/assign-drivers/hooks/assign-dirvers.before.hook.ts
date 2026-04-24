import { BadRequest } from "@feathersjs/errors";
import { HookContext } from "@feathersjs/feathers";


export function beforePatchValidationAssignDrivers(options:any={}) {
    return (context : HookContext)=>{
        const {data,params,app } = context;
        if(!data.driver){
            throw new BadRequest(`Path assignDriver driver not found`)
        }
        data.driverAssignedby = params?.credential?._id.toString() || null; 
        data.driverAssignedDate = new Date();
    

        return context
    }
}

