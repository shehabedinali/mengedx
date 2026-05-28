"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
function default_1(app) {
    const modelName = 'contactAndAddress';
    const mongooseClient = app.get('mongooseClient');
    const { Schema } = mongooseClient;
    const schema = new Schema({
        user: {
            type: mongooseClient.Schema.Types.ObjectId,
            ref: 'users',
            // required: true
        },
        phoneNumber: { type: String, unique: true },
        emergencyContact: { type: String },
        emergencyContactName: { type: String },
        city: { type: String },
        country: { type: String }
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
