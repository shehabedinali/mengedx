"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beforePatchValidationAssignDrivers = beforePatchValidationAssignDrivers;
const errors_1 = require("@feathersjs/errors");
function beforePatchValidationAssignDrivers(options = {}) {
    return (context) => {
        var _a;
        const { data, params, app } = context;
        if (data.driver === undefined) {
            throw new errors_1.BadRequest(`Path assignDriver driver not found`);
        }
        data.driverAssignedby = ((_a = params === null || params === void 0 ? void 0 : params.credential) === null || _a === void 0 ? void 0 : _a._id.toString()) || null;
        data.driverAssignedDate = new Date();
        return context;
    };
}
