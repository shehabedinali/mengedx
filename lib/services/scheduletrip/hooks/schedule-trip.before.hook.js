"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beforeCreateValidatorScheduleTrip = beforeCreateValidatorScheduleTrip;
const errors_1 = require("@feathersjs/errors");
function beforeCreateValidatorScheduleTrip(options = {}) {
    return (context) => {
        var _a;
        const { data, params, app } = context;
        if (!data.bus || !data.route || !data.fare || !data.departureTime || !data.tripDate || !data.tripStatus) {
            throw new errors_1.BadRequest("Path SceduleTrip some fields not found");
        }
        data.tripScheduledBy = ((_a = params === null || params === void 0 ? void 0 : params.credential) === null || _a === void 0 ? void 0 : _a._id.toString()) || null;
        data.tripScheduledDate = new Date();
        console.log(data, "data for tip");
        return context;
    };
}
