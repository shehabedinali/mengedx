"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scheduletrip = void 0;
class Scheduletrip {
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
        const result = await this.app.service('trips').create(data);
        return result;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async update(id, data, params) {
        return data;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async patch(id, data, params) {
        return data;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async remove(id, params) {
        return { id };
    }
}
exports.Scheduletrip = Scheduletrip;
