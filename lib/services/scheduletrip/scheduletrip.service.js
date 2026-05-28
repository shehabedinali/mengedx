"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const scheduletrip_class_1 = require("./scheduletrip.class");
const scheduletrip_hooks_1 = __importDefault(require("./scheduletrip.hooks"));
function default_1(app) {
    const options = {
        paginate: app.get('paginate')
    };
    // Initialize our service with any options it requires
    app.use('/scheduletrip', new scheduletrip_class_1.Scheduletrip(options, app));
    // Get our initialized service so that we can register hooks
    const service = app.service('scheduletrip');
    service.hooks(scheduletrip_hooks_1.default);
}
