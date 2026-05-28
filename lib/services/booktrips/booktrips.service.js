"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const booktrips_class_1 = require("./booktrips.class");
const booktrips_hooks_1 = __importDefault(require("./booktrips.hooks"));
function default_1(app) {
    const options = {
        paginate: app.get('paginate')
    };
    // Initialize our service with any options it requires
    app.use('/booktrips', new booktrips_class_1.Booktrips(options, app));
    // Get our initialized service so that we can register hooks
    const service = app.service('booktrips');
    service.hooks(booktrips_hooks_1.default);
}
