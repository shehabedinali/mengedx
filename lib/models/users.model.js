"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
function default_1(app) {
    const modelName = 'users';
    const mongooseClient = app.get('mongooseClient');
    const { Schema } = mongooseClient;
    const schema = new Schema({
        company: {
            type: mongooseClient.Schema.Types.ObjectId,
            ref: "companies"
        },
        //fileds
        firstName: { type: String },
        lastName: { type: String },
        status: { type: String, enum: ['active', 'inactive'] },
        startedAt: { type: Date },
        userRole: { type: String, enum: ['Admin', 'User', 'Ticketer', "Manager"] }
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
