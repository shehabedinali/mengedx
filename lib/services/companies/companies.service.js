"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const companies_class_1 = require("./companies.class");
const companies_model_1 = __importDefault(require("../../models/companies.model"));
const companies_hooks_1 = __importDefault(require("./companies.hooks"));
function default_1(app) {
    const options = {
        Model: (0, companies_model_1.default)(app),
        paginate: app.get('paginate')
    };
    // Initialize our service with any options it requires
    app.use('/companies', new companies_class_1.Companies(options, app));
    // Get our initialized service so that we can register hooks
    const service = app.service('companies');
    service.hooks(companies_hooks_1.default);
}
