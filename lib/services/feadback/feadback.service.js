"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const feadback_class_1 = require("./feadback.class");
const feadback_model_1 = __importDefault(require("../../models/feadback.model"));
const feadback_hooks_1 = __importDefault(require("./feadback.hooks"));
function default_1(app) {
    const options = {
        Model: (0, feadback_model_1.default)(app),
        paginate: app.get('paginate')
    };
    // Initialize our service with any options it requires
    app.use('/feadback', new feadback_class_1.Feadback(options, app));
    // Get our initialized service so that we can register hooks
    const service = app.service('feadback');
    service.hooks(feadback_hooks_1.default);
}
