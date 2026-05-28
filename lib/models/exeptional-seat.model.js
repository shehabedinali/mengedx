"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
function default_1(app) {
    const modelName = 'exeptionalSeat';
    const mongooseClient = app.get('mongooseClient');
    const { Schema } = mongooseClient;
    const schema = new Schema({
        bus: {
            type: mongooseClient.Schema.Types.ObjectId,
            ref: 'buses'
        },
        SeatWithExeption: {
            type: Array.of({
                seatTage: { type: String },
                exeptionSeatsOrder: { type: Number },
            }),
        }
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
