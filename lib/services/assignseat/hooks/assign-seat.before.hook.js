"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beforePatchValidationAssignSeat = beforePatchValidationAssignSeat;
const errors_1 = require("@feathersjs/errors");
function beforePatchValidationAssignSeat(options = {}) {
    return (context) => {
        var _a;
        const { data, params, app } = context;
        if (!data.seatmap) {
            throw new errors_1.BadRequest('path assignSeat required attributes not found');
        }
        data.seatmapAssignedDate = new Date();
        data.seatmapAssignedBy = ((_a = params === null || params === void 0 ? void 0 : params.credential) === null || _a === void 0 ? void 0 : _a._id.toString()) || null;
        return context;
    };
}
