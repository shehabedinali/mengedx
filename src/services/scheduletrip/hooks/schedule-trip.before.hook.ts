import { BadRequest } from "@feathersjs/errors";
import { HookContext } from "@feathersjs/feathers";


export function beforeCreateValidatorScheduleTrip(options:any={}) {
    return (context:HookContext)=>{
        const {data, params,app} = context;
        if(!data.bus || ! data.route || ! data.fare || ! data.departureTime || ! data.tripDate || ! data.tripStatus) {
            throw new BadRequest("Path SceduleTrip some fields not found");
        }
        data.tripScheduledBy =  params?.credential?._id.toString() || null;
        data.tripScheduledDate = new Date();
        console.log(data,"data for tip")
        return context
    }
}

        

