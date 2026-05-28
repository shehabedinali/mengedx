import { BadRequest } from "@feathersjs/errors";
import { HookContext } from "@feathersjs/feathers";

export function beforePatchValidationAssignSeat(options:any={}) {
    return (context : HookContext)=>{
        const {data,params,app } = context;
        if( !data.seatMap ){
            throw new BadRequest('path assignSeat required attributes not found')
        }
        data.seatMapAssignedAt = new Date();
        data.seatMapAssignedBy = params?.users?._id.toString() || null;
        
        return context
    }
}