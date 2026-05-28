"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const assign_drivers_class_1 = require("./assign-drivers.class");
const assign_drivers_hooks_1 = __importDefault(require("./assign-drivers.hooks"));
function default_1(app) {
    const options = {
        paginate: app.get('paginate')
    };
    // Initialize our service with any options it requires
    app.use('/assign-drivers', new assign_drivers_class_1.AssignDrivers(options, app));
    // Get our initialized service so that we can register hooks
    const service = app.service('assign-drivers');
    service.hooks(assign_drivers_hooks_1.default);
}
