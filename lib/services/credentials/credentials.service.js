"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const credentials_class_1 = require("./credentials.class");
const credentials_model_1 = __importDefault(require("../../models/credentials.model"));
const credentials_hooks_1 = __importDefault(require("./credentials.hooks"));
function default_1(app) {
    const options = {
        Model: (0, credentials_model_1.default)(app),
        paginate: app.get('paginate')
    };
    // Initialize our service with any options it requires
    app.use('/credentials', new credentials_class_1.Credentials(options, app));
    // Get our initialized service so that we can register hooks
    const service = app.service('credentials');
    service.hooks(credentials_hooks_1.default);
}
