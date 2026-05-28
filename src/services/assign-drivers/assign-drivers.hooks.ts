import { HooksObject } from '@feathersjs/feathers';
import * as authentication from '@feathersjs/authentication';
import { beforePatchValidationAssignDrivers } from './hooks/assign-dirvers.before.hook';
// Don't remove this comment. It's needed to format import lines nicely.

const { authenticate } = authentication.hooks;

export default {
  before: {
    all: [ authenticate('jwt') ],
    find: [authenticate('jwt')],
    get: [authenticate('jwt')],
    create: [authenticate('jwt')],
    update: [authenticate('jwt')],
    patch: [authenticate("jwt"),beforePatchValidationAssignDrivers()],
    remove: [authenticate('jwt')]
  },

  after: {
    all: [],
    find: [],
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
