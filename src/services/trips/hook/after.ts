import { HookContext } from "@feathersjs/feathers";

export const afterFindPopulator = (option:any = {})=>{
    return async (context :HookContext) => {
    
    context.result.data = await Promise.all(
        context.result.data.map((bus: any) =>
            context.service.Model.populate(bus, [
                { path: 'route' },
                { path: 'bus' },
                
            ])
        )
    );
    
   
    return context


}
}
