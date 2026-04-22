import { BadRequest } from "@feathersjs/errors";
import { HookContext } from "@feathersjs/feathers";

export function beforePatchValidationAssignSeat(options:any={}) {
    return (context : HookContext)=>{
        const {data,params,app } = context;
        if( !data.seatmap ){
            throw new BadRequest('path assignSeat required attributes not found')
        }
        data.seatmapAssignedDate = new Date();
        data.seatmapAssignedBy = params?.credential?._id.toString() || null;
        
        return context
    }
}