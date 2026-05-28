"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const seatmap_class_1 = require("./seatmap.class");
const seatMap_model_1 = __importDefault(require("../../models/seatMap.model"));
const seatmap_hooks_1 = __importDefault(require("./seatmap.hooks"));
function default_1(app) {
    const options = {
        Model: (0, seatMap_model_1.default)(app),
        paginate: app.get('paginate')
    };
    // Initialize our service with any options it requires
    app.use('/seatmap', new seatmap_class_1.Seatmap(options, app));
    // Get our initialized service so that we can register hooks
    const service = app.service('seatmap');
    service.hooks(seatmap_hooks_1.default);
}
