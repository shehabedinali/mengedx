"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
function default_1(app) {
    const modelName = 'buses';
    const mongooseClient = app.get('mongooseClient');
    const { Schema } = mongooseClient;
    const schema = new Schema({
        seatmap: { type: mongooseClient.Schema.Types.ObjectId, ref: 'seatmap' },
        seatmapAssignedBy: { type: mongooseClient.Schema.Types.ObjectId, ref: 'users' },
        driverAssignedby: { type: mongooseClient.Schema.Types.ObjectId, ref: 'users' },
        driverAssignedDate: { type: Date },
        seatmapAssignedDate: { type: Date },
        company: { type: mongooseClient.Schema.Types.ObjectId, ref: 'companies' },
        driver: { type: mongooseClient.Schema.Types.ObjectId, ref: 'drivers' },
        capacity: { type: Number },
        name: { type: String, required: true },
        plateNumber: { type: String },
        status: { type: String, enum: ['Active', 'Inactive', 'Maintenance'], default: 'Active' },
        type: { type: String, enum: ['Standard', 'Luxury', 'Sleeper'] },
        lastTrip: { type: String },
        revenue: { type: Number }
    }, {
        timestamps: true
    });
    // This is necessary to avoid model compilation errors in watch mode
    // see https://mongoosejs.com/docs/api/connection.html#connection_Connection-deleteModel
    if (mongooseClient.modelNames().includes(modelName)) {
        mongooseClient.deleteModel(modelName);
    }
    return mongooseClient.model(modelName, schema);
}
