"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const assignseat_class_1 = require("./assignseat.class");
const assignseat_hooks_1 = __importDefault(require("./assignseat.hooks"));
function default_1(app) {
    const options = {
        paginate: app.get('paginate')
    };
    // Initialize our service with any options it requires
    app.use('/assignseat', new assignseat_class_1.Assignseat(options, app));
    // Get our initialized service so that we can register hooks
    const service = app.service('assignseat');
    service.hooks(assignseat_hooks_1.default);
}
