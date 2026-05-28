"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const credentials_service_1 = __importDefault(require("./credentials/credentials.service"));
const companies_service_1 = __importDefault(require("./companies/companies.service"));
const users_service_1 = __importDefault(require("./users/users.service"));
const drivers_service_1 = __importDefault(require("./drivers/drivers.service"));
const buses_service_1 = __importDefault(require("./buses/buses.service"));
const routes_service_1 = __importDefault(require("./routes/routes.service"));
const trips_service_1 = __importDefault(require("./trips/trips.service"));
const booked_seats_service_1 = __importDefault(require("./booked-seats/booked-seats.service"));
const seatmap_service_1 = __importDefault(require("./seatmap/seatmap.service"));
const contact_and_address_service_1 = __importDefault(require("./contact-and-address/contact-and-address.service"));
const exeptional_seat_service_1 = __importDefault(require("./exeptional-seat/exeptional-seat.service"));
const feadback_service_1 = __importDefault(require("./feadback/feadback.service"));
const assign_drivers_service_1 = __importDefault(require("./assign-drivers/assign-drivers.service"));
const assignseat_service_1 = __importDefault(require("./assignseat/assignseat.service"));
const scheduletrip_service_1 = __importDefault(require("./scheduletrip/scheduletrip.service"));
const booktrips_service_1 = __importDefault(require("./booktrips/booktrips.service"));
// Don't remove this comment. It's needed to format import lines nicely.
function default_1(app) {
    app.configure(credentials_service_1.default);
    app.configure(companies_service_1.default);
    app.configure(users_service_1.default);
    app.configure(drivers_service_1.default);
    app.configure(buses_service_1.default);
    app.configure(routes_service_1.default);
    app.configure(trips_service_1.default);
    app.configure(booked_seats_service_1.default);
    app.configure(seatmap_service_1.default);
    app.configure(contact_and_address_service_1.default);
    app.configure(exeptional_seat_service_1.default);
    app.configure(feadback_service_1.default);
    app.configure(assign_drivers_service_1.default);
    app.configure(assignseat_service_1.default);
    app.configure(scheduletrip_service_1.default);
    app.configure(booktrips_service_1.default);
}
