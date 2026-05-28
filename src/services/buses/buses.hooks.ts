import { HooksObject } from '@feathersjs/feathers';
import * as authentication from '@feathersjs/authentication';
import { afterFindPopulator } from './hook/after';
// Don't remove this comment. It's needed to format import lines nicely.

const { authenticate } = authentication.hooks;

const searchHook = (context: any) => {
  const { search } = context.params.query || {};
  if (search) {
    const regex = new RegExp(search, 'i');
    context.params.query.$or = [
      { name: regex },
      { plateNumber: regex },
    ];
    delete context.params.query.search;
  }
  return context;
};

export default {
  before: {
    all: [ authenticate('jwt') ],
    find: [authenticate('jwt'), ],
    get: [authenticate('jwt')],
    create: [authenticate('jwt')],
    update: [authenticate('jwt')],
    patch: [authenticate('jwt')],
    remove: [authenticate('jwt')]
  },

  after: {
    all: [],
    find: [afterFindPopulator()],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
