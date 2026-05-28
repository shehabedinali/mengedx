"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const buses_class_1 = require("./buses.class");
const buses_model_1 = __importDefault(require("../../models/buses.model"));
const buses_hooks_1 = __importDefault(require("./buses.hooks"));
function default_1(app) {
    const options = {
        Model: (0, buses_model_1.default)(app),
        paginate: app.get('paginate')
    };
    // Initialize our service with any options it requires
    app.use('/buses', new buses_class_1.Buses(options, app));
    // Get our initialized service so that we can register hooks
    const service = app.service('buses');
    service.hooks(buses_hooks_1.default);
}
