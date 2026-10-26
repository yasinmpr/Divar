const { Schema, model, Types } = require("mongoose");

const OptionSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    key: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        default: "string",
        enum: ["string", "number", "boolean", "selection", "multiple"],
    },
    values: {
        type: Array,
        required: true,
        default: [],
    },
    guid: {
        type: String,
        required: false,
        default: null,
    },
    required: {
        type: Boolean,
        default: false,
        required: true,
    },
    categoryId: {
        type: Types.ObjectId,
        required: true,
        ref: "category",
    },
});

const optionModel = model("option", OptionSchema);
module.exports = optionModel;
