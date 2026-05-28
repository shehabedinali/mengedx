"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
function default_1(app) {
    const modelName = 'routes';
    const mongooseClient = app.get('mongooseClient');
    const { Schema } = mongooseClient;
    const schema = new Schema({
        routeName: { type: String },
        status: { type: String, enum: ["Active", "Inactive"] },
        origin: { type: String },
        destination: { type: [String] },
        distance: { type: Number },
        duration: { type: Number }
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
