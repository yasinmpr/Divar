const { Schema, model, Types } = require("mongoose");

const OptionSchema = new Schema(
    {
        optionId: { type: Types.ObjectId, required: true },
        value: { type: Schema.Types.Mixed, default: null },
    },
    { _id: false },
);

const PostSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "user",
            required: true,
            index: true,
        },
        categoryId: {
            type: Types.ObjectId,
            ref: "category",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        images: {
            type: [String],
            validate: {
                validator: (value) => value.length >= 1,
                message: "At least one image is required",
            },
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                required: true,
            },
            coordinates: {
                type: [Number],
                required: true,
                validate: {
                    validator: (value) =>
                        value.length === 2 &&
                        value[0] >= -180 &&
                        value[0] <= 180 &&
                        value[1] >= -90 &&
                        value[1] <= 90,
                    message: "Invalid coordinates",
                },
            },
        },
        city: {
            type: String,
            required: true,
        },
        neighbourhood: {
            type: String,
            default: null,
        },
        address: { type: String, required: true },
        video: { type: String, default: null },
        options: { type: [OptionSchema], required: true },
    },
    {
        timestamps: true,
    },
);

PostSchema.index({ categoryId: 1 });
PostSchema.index({ city: 1, neighbourhood: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ location: "2dsphere" });
const PostModel = model("Post", PostSchema);
module.exports = PostModel;
