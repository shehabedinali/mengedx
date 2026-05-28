"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
function default_1(app) {
    const modelName = 'bookedSeats';
    const mongooseClient = app.get('mongooseClient');
    const { Schema } = mongooseClient;
    const schema = new Schema({
        bookedBy: { type: mongooseClient.Schema.Types.ObjectId, ref: 'users' },
        trip: {
            type: mongooseClient.Schema.Types.ObjectId,
            ref: 'trips'
        },
        user: {
            type: mongooseClient.Schema.Types.ObjectId,
            ref: 'users'
        },
        seats: [{
                type: String
            }],
        status: {
            type: String,
            enum: ['Booked', 'Pending', 'PendingPayment', 'Driver', "SeatWithIssue"]
        },
        phoneNumber: {
            type: String
        },
        emergencyContact: {
            type: String
        },
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
