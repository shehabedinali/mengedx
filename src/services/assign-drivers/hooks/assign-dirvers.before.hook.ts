import { BadRequest } from "@feathersjs/errors";
import { HookContext } from "@feathersjs/feathers";


export function beforePatchValidationAssignDrivers(options:any={}) {
    return (context : HookContext)=>{
        const {data,params,app } = context;
        if(!data.driver){
            throw new BadRequest(`Path assignDriver driver not found`)
        }
        data.assignedby = params?.credential?._id.toString() || '69e7725d43ce430c31638e72';
        data.assignedDate = new Date();
        data.driver = data?.driver;

        return context
    }
}