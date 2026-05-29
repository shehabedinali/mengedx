import { HookContext } from "@feathersjs/feathers";

export const afterFindPopulator = (_option: any = {}) => {
    return async (context: HookContext) => {
        context.result.data = await Promise.all(
            context.result.data.map((office: any) =>
                context.service.Model.populate(office, [{ path: 'users' }])
            )
        );
        return context;
    };
};

export const afterGetPopulator = (_option: any = {}) => {
    return async (context: HookContext) => {
        context.result = await context.service.Model.populate(context.result, [
            { path: 'users' },
        ]);
        return context;
    };
};
