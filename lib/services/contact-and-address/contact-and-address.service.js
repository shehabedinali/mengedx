"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const contact_and_address_class_1 = require("./contact-and-address.class");
const contact_and_address_model_1 = __importDefault(require("../../models/contact-and-address.model"));
const contact_and_address_hooks_1 = __importDefault(require("./contact-and-address.hooks"));
function default_1(app) {
    const options = {
        Model: (0, contact_and_address_model_1.default)(app),
        paginate: app.get('paginate')
    };
    // Initialize our service with any options it requires
    app.use('/contact-and-address', new contact_and_address_class_1.ContactAndAddress(options, app));
    // Get our initialized service so that we can register hooks
    const service = app.service('contact-and-address');
    service.hooks(contact_and_address_hooks_1.default);
}
