"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const drivers_class_1 = require("./drivers.class");
const drivers_model_1 = __importDefault(require("../../models/drivers.model"));
const drivers_hooks_1 = __importDefault(require("./drivers.hooks"));
function default_1(app) {
    const options = {
        Model: (0, drivers_model_1.default)(app),
        paginate: app.get('paginate')
    };
    // Initialize our service with any options it requires
    app.use('/drivers', new drivers_class_1.Drivers(options, app));
    // Get our initialized service so that we can register hooks
    const service = app.service('drivers');
    service.hooks(drivers_hooks_1.default);
}
