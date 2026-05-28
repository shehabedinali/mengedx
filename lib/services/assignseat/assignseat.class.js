"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Assignseat = void 0;
const errors_1 = require("@feathersjs/errors");
class Assignseat {
    constructor(options = {}, app) {
        this.options = options;
        this.app = app;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async find(params) {
        return [];
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async get(id, params) {
        return {
            id, text: `A new message with ID: ${id}!`
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async create(data, params) {
        return {};
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async update(id, data, params) {
        return data;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async patch(id, data, params) {
        var _a, _b;
        if (!id) {
            throw new Error('id is required for patching seatmap');
        }
        const result = await this.app.service('buses').find({
            query: {
                _id: id,
                $limit: 1,
                $select: ['seatmapAssignedBy']
            }
        });
        if ((_b = (_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.seatmapAssignedBy) {
            throw new errors_1.BadRequest(`The seatmap is already assigned to a bus`);
        }
        const seatmap = this.app.service('buses').patch(id, data);
        return seatmap;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async remove(id, params) {
        return { id };
    }
}
exports.Assignseat = Assignseat;
