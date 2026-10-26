const { Schema, model } = require("mongoose");
const httpErrors = require("http-errors");

const CategorySchema = new Schema(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        icon: { type: String, default: null },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: "category",
            required: false,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

CategorySchema.pre("validate", function () {
    if (!this.parentId && !this.icon) {
        throw new httpErrors.BadRequest("Root category must have an icon");
    }

    if (this.parentId && this.icon) {
        throw new httpErrors.BadRequest(
            "non root category cannot have an icon",
        );
    }

    return true;
});

const CategoryModel = model("category", CategorySchema);
module.exports = CategoryModel;
