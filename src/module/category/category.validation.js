const Joi = require("joi");

const objectId = (message) =>
    Joi.string().hex().length(24).required().lowercase().messages({
        "any.required": message,
        "string.empty": message,
        "string.hex": message,
        "string.length": message,
    });

const createCategoryValidation = Joi.object({
    title: Joi.string().trim().min(3).required().messages({
        "any.required": "category title is required",
        "string.empty": "category title is required",
        "string.min": "category title must be at least 3 character",
    }),

    slug: Joi.string().trim().min(3).required().messages({
        "any.required": "category slug is required",
        "string.empty": "category slug is required",
        "string.min": "category slug must be at least 3 character",
    }),

    parentId: Joi.alternatives()
        .try(
            Joi.string().hex().length(24).messages({
                "string.hex": "invalid parent id",
                "string.length": "invalid parent id",
            }),
            Joi.valid("null", null),
        )
        .default(null)
        .custom((value) => {
            if (value === "null") {
                return null;
            }

            return value;
        }),
}).unknown(false);

const getCategoryByIdValidation = Joi.object({
    categoryId: objectId("category id is invalid"),
}).unknown(false);

const updateCategoryParamsValidation = Joi.object({
    categoryId: objectId("category id is invalid"),
}).unknown(false);

const updateCategoryBodyValidation = Joi.object({
    title: Joi.string().trim().min(3).messages({
        "string.base": "category title must be a string",
        "string.empty": "category title is invalid",
        "string.min": "category title must be at least 3 character",
    }),

    slug: Joi.string().trim().min(3).messages({
        "string.base": "category slug must be a string",
        "string.empty": "category slug is invalid",
        "string.min": "category slug must be at least 3 character",
    }),

    parentId: Joi.alternatives()
        .try(
            Joi.string().hex().length(24).messages({
                "string.hex": "invalid parent category id",
                "string.length": "invalid parent category id",
            }),
            Joi.valid("null", null),
        )
        .custom((value) => {
            if (value === "null") {
                return null;
            }

            return value;
        }),

    deleteIcon: Joi.boolean()
        .truthy("true")
        .falsy("false")
        .default(false)
        .messages({
            "boolean.base": "deleteIcon must be boolean",
        }),
}).unknown(false);

const deleteCategoryValidation = Joi.object({
    categoryId: objectId("invalid category id"),
}).unknown(false);

module.exports = {
    getCategoryByIdValidation,
    createCategoryValidation,
    updateCategoryParamsValidation,
    updateCategoryBodyValidation,
    deleteCategoryValidation,
};
