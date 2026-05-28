"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignDrivers = void 0;
const errors_1 = require("@feathersjs/errors");
class AssignDrivers {
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
        if (Array.isArray(data)) {
            return Promise.all(data.map(current => this.create(current, params)));
        }
        return data;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async update(id, data, params) {
        return data;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async patch(id, data, params) {
        var _a, _b;
        if (!id) {
            throw new errors_1.BadRequest(`Path assignDriver userId not found`);
        }
        //check if the bus exists
        await this.app.service('buses').get(id);
        //check it any bus do have the driver with the given driverid
        const result = await this.app.service('buses').find({
            query: {
                driver: data.driver,
                $limit: 1,
                $select: ['driverAssignedDate']
            }
        });
        if ((_b = (_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.driverAssignedDate) {
            throw new errors_1.BadRequest(`The driver is already assigned to a bus`);
        }
        const assignedBus = await this.app.service('buses').patch(id, data);
        return assignedBus;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async remove(id, params) {
        return { id };
    }
}
exports.AssignDrivers = AssignDrivers;
