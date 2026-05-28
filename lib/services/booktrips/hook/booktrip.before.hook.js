"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beforeCreateValidatorBookTrip = beforeCreateValidatorBookTrip;
function beforeCreateValidatorBookTrip(options = {}) {
    return (context) => {
        var _a;
        const { data, app, params } = context;
        if (!data.trip || !data.seats || !data.status || !data.phoneNumber || !data.emergencyContact) {
            throw new Error("Path booktrip fields not found");
        }
        data.bookedBy = ((_a = params === null || params === void 0 ? void 0 : params.credential) === null || _a === void 0 ? void 0 : _a._id.toString()) || null;
        return context;
    };
}
