"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const booked_seats_class_1 = require("./booked-seats.class");
const booked_seats_model_1 = __importDefault(require("../../models/booked-seats.model"));
const booked_seats_hooks_1 = __importDefault(require("./booked-seats.hooks"));
function default_1(app) {
    const options = {
        Model: (0, booked_seats_model_1.default)(app),
        paginate: app.get('paginate')
    };
    // Initialize our service with any options it requires
    app.use('/booked-seats', new booked_seats_class_1.BookedSeats(options, app));
    // Get our initialized service so that we can register hooks
    const service = app.service('booked-seats');
    service.hooks(booked_seats_hooks_1.default);
}
