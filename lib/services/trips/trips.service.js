"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const trips_class_1 = require("./trips.class");
const trips_model_1 = __importDefault(require("../../models/trips.model"));
const trips_hooks_1 = __importDefault(require("./trips.hooks"));
function default_1(app) {
    const options = {
        Model: (0, trips_model_1.default)(app),
        paginate: app.get('paginate')
    };
    // Initialize our service with any options it requires
    app.use('/trips', new trips_class_1.Trips(options, app));
    // Get our initialized service so that we can register hooks
    const service = app.service('trips');
    service.hooks(trips_hooks_1.default);
}
