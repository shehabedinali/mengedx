import { BadRequest } from "@feathersjs/errors";
import { HookContext } from "@feathersjs/feathers";


export function beforePatchValidationAssignDrivers(options:any={}) {
    return (context : HookContext)=>{
        
        const {data,params,app } = context;
        if(data.driver ){
           data.driverAssignedBy = params?.users?._id.toString() || null; 
           data.driverAssignedAt = new Date();
           data.status = 'Assigned';
        }else{
           data.driverAssignedBy = null; 
           data.driverAssignedAt = null;
           data.status = 'Active';
        }
        
        
       
    

        return context
    }
}

