"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const exeptional_seat_class_1 = require("./exeptional-seat.class");
const exeptional_seat_model_1 = __importDefault(require("../../models/exeptional-seat.model"));
const exeptional_seat_hooks_1 = __importDefault(require("./exeptional-seat.hooks"));
function default_1(app) {
    const options = {
        Model: (0, exeptional_seat_model_1.default)(app),
        paginate: app.get('paginate')
    };
    // Initialize our service with any options it requires
    app.use('/exeptional-seat', new exeptional_seat_class_1.ExeptionalSeat(options, app));
    // Get our initialized service so that we can register hooks
    const service = app.service('exeptional-seat');
    service.hooks(exeptional_seat_hooks_1.default);
}
