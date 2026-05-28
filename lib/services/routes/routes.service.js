"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const routes_class_1 = require("./routes.class");
const routes_model_1 = __importDefault(require("../../models/routes.model"));
const routes_hooks_1 = __importDefault(require("./routes.hooks"));
function default_1(app) {
    const options = {
        Model: (0, routes_model_1.default)(app),
        paginate: app.get('paginate')
    };
    // Initialize our service with any options it requires
    app.use('/routes', new routes_class_1.Routes(options, app));
    // Get our initialized service so that we can register hooks
    const service = app.service('routes');
    service.hooks(routes_hooks_1.default);
}
