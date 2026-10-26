const Joi = require("joi");

const objectId = (message) =>
    Joi.string().hex().length(24).required().messages({
        "any.required": message,
        "string.empty": message,
        "string.hex": message,
        "string.length": message,
    });

const createOptionValidation = Joi.object({
    title: Joi.string().trim().min(3).required().messages({
        "any.required": "Option title is required",
        "string.empty": "invalid option title",
        "string.min": "option title must be at least 3 characters",
    }),

    key: Joi.string().trim().min(3).required().messages({
        "any.required": "Option key is required",
        "string.empty": "Invalid option key",
        "string.min": "option key must be at least 3 characters",
    }),

    type: Joi.string()
        .trim()
        .lowercase()
        .valid("string", "number", "boolean", "selection", "multiple")
        .required()
        .messages({
            "any.required": "option type is required",
            "any.only": "Invalid option type",
            "string.empty": "option type is required",
        }),

    values: Joi.alternatives()
        .try(
            Joi.string().custom((value, helpers) => {
                let parsed;

                try {
                    parsed = JSON.parse(value);
                } catch {
                    return helpers.error("any.invalid");
                }

                if (!Array.isArray(parsed)) {
                    return helpers.error("any.invalid");
                }

                return parsed;
            }),

            Joi.array(),
        )
        .default([])
        .messages({
            "any.invalid": "values must be a valid JSON array",
        }),

    categoryId: objectId("category id is invalid"),

    guid: Joi.string().trim().min(3).allow("null", null).messages({
        "string.base": "guid must be a string",
        "string.min": "option guid must be at least 3 characters",
    }),

    required: Joi.boolean().truthy("true").falsy("false").required().messages({
        "any.required": "required is required",
        "boolean.base": "required must be boolean",
    }),
}).unknown(false);

const getOptionByIdValidation = Joi.object({
    optionId: objectId("option id is invalid"),
}).unknown(false);

const getOptionsByCategoryIdValidation = Joi.object({
    categoryId: objectId("invalid category id"),
}).unknown(false);

const getOptionsByCategorySlugValidation = Joi.object({
    categorySlug: Joi.string().trim().required().messages({
        "any.required": "category slug is required",
        "string.empty": "invalid category slug",
    }),
}).unknown(false);

const updateOptionParamsValidation = Joi.object({
    optionId: objectId("invalid option id"),
}).unknown(false);

const updateOptionBodyValidation = Joi.object({
    title: Joi.string().trim().min(3).messages({
        "string.base": "title has to be string",
        "string.empty": "invalid option title",
        "string.min": "option title must be at least 3 characters",
    }),

    key: Joi.string().trim().min(3).messages({
        "string.base": "new key is not valid for an option",
        "string.empty": "new key is not valid for an option",
        "string.min": "option key must be at least 3 characters",
    }),

    type: Joi.string().trim().lowercase().messages({
        "string.base": "option type must be a string value",
    }),

    values: Joi.alternatives()
        .try(
            Joi.string().custom((value, helpers) => {
                let parsed;

                try {
                    parsed = JSON.parse(value);
                } catch {
                    return helpers.error("any.invalid");
                }

                if (!Array.isArray(parsed)) {
                    return helpers.error("any.invalid");
                }

                return parsed;
            }),

            Joi.array(),
        )
        .messages({
            "any.invalid": "values must be a valid JSON array",
        }),

    required: Joi.boolean().truthy("true").falsy("false").messages({
        "boolean.base": "invalid required value",
    }),

    guid: Joi.string().trim().min(3).allow("null", null).messages({
        "string.base": "new guid is not valid for an option",
        "string.min": "option guid must be at least 3 characters",
    }),
}).unknown(false);

const deleteOptionValidation = Joi.object({
    optionId: objectId("option id is invalid"),
}).unknown(false);

module.exports = {
    getOptionByIdValidation,
    getOptionsByCategoryIdValidation,
    getOptionsByCategorySlugValidation,
    createOptionValidation,
    updateOptionParamsValidation,
    updateOptionBodyValidation,
    deleteOptionValidation,
};
