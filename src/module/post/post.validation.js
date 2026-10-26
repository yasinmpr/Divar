const Joi = require("joi");

const objectId = (message) =>
    Joi.string().hex().length(24).required().lowercase().messages({
        "any.required": message,
        "string.empty": message,
        "string.hex": message,
        "string.length": message,
    });

const locationSchema = Joi.string()
    .custom((value, helpers) => {
        let location;

        try {
            location = JSON.parse(value);
        } catch {
            return helpers.error("location.invalidJson");
        }

        if (
            !location ||
            typeof location !== "object" ||
            Array.isArray(location)
        ) {
            return helpers.error("location.object");
        }

        const { lng, lat } = location;
        if (lng === undefined || lng === null) {
            return helpers.error("location.longitude");
        }

        if (lat === undefined || lat === null) {
            return helpers.error("location.latitude");
        }

        if (!Number.isFinite(lng)) {
            return helpers.error("location.longitudeType");
        }

        if (!Number.isFinite(lat)) {
            return helpers.error("location.latitudeType");
        }

        if (lng < -180 || lng > 180) {
            return helpers.error("location.longitudeRange");
        }

        if (lat < -90 || lat > 90) {
            return helpers.error("location.latitudeRange");
        }

        return location;
    })
    .messages({
        "string.base": "location must be a JSON string",
        "location.invalidJson": "location must be valid JSON",
        "location.object": "location must be an object",
        "location.longitude": "longitude is required",
        "location.latitude": "latitude is required",
        "location.longitudeType": "longitude must be a number",
        "location.latitudeType": "latitude must be a number",
        "location.longitudeRange": "invalid longitude",
        "location.latitudeRange": "invalid latitude",
    });

const optionsObjectSchema = Joi.object()
    .pattern(
        Joi.string().trim().min(1),
        Joi.alternatives().try(
            Joi.string(),
            Joi.number(),
            Joi.boolean(),
            Joi.array().items(
                Joi.alternatives().try(Joi.string(), Joi.number()),
            ),
        ),
    )
    .unknown(false);

const optionsSchema = Joi.string().custom((value, helpers) => {
    let options;

    try {
        options = JSON.parse(value);
    } catch {
        return helpers.message("option must be a valid json");
    }

    const { error, value: validatedOptions } =
        optionsObjectSchema.validate(options);

    if (error) {
        return helpers.message(error.message);
    }

    return validatedOptions;
});

const getPostByIdValidation = Joi.object({
    postId: objectId("invalid post id"),
}).unknown(false);

const getPostsValidation = Joi.object({
    categorySlug: Joi.string().trim().min(1).messages({
        "string.base": "category slug must be a string",
    }),

    city: Joi.string().trim().allow("").messages({
        "string.base": "invalid city",
    }),

    neighbourhood: Joi.string().trim().messages({
        "string.base": "invalid neighbourhood",
    }),

    hasVideo: Joi.boolean().truthy("true").falsy("false").messages({
        "boolean.base": "invalid hasVideo",
    }),

    publishedAfter: Joi.string()
        .trim()
        .valid(
            "3hours-ago",
            "12hours-ago",
            "1day-ago",
            "3days-ago",
            "7days-ago",
        )
        .messages({
            "any.only": "invalid publishedAfter",
        }),

    page: Joi.number().integer().min(1).messages({
        "number.base": "invalid page",
        "number.integer": "invalid page",
        "number.min": "invalid page",
    }),

    limit: Joi.number().integer().min(1).max(100).messages({
        "number.base": "invalid limit",
        "number.integer": "invalid limit",
        "number.min": "invalid limit",
        "number.max": "invalid limit",
    }),

    sort: Joi.string().lowercase().valid("latest", "oldest").messages({
        "string.base": "invalid sort",
        "any.only": "invalid sort",
    }),
}).unknown(true);

const createPostValidation = Joi.object({
    title: Joi.string().trim().min(5).required().messages({
        "any.required": "post title required",
        "string.empty": "post title required",
        "string.min": "title must be at least 5 characters",
    }),

    content: Joi.string().trim().min(10).required().messages({
        "any.required": "post content required",
        "string.empty": "post content required",
        "string.min": "content must be at least 10 characters",
    }),

    category: Joi.string().trim().min(1).required().messages({
        "any.required": "category slug required",
        "string.empty": "category slug required",
    }),

    location: locationSchema.required().messages({
        "any.required": "location is required",
        "string.empty": "location is required",
    }),

    city: Joi.string().trim().required().messages({
        "any.required": "city cannot be null",
        "string.empty": "city is not valid",
    }),

    neighbourhood: Joi.string().trim().allow("", "null", null).messages({
        "string.base": "neighbourhood has to be string",
    }),

    address: Joi.string().trim().required().messages({
        "any.required": "address required",
        "string.empty": "address required",
    }),

    options: optionsSchema,
});

const updatePostParamsValidation = Joi.object({
    postId: objectId("invalid post id"),
}).unknown(false);

const updatePostBodyValidation = Joi.object({
    title: Joi.string().trim().invalid("null", null).min(5).messages({
        "string.base": "title has to be string",
        "string.invalid": "title must be at least 5 characters",
        "string.min": "title must be at least 5 characters",
    }),

    content: Joi.string().trim().invalid("null", null).min(10).messages({
        "string.base": "content has to be string",
        "string.invalid": "content must be at least 10 characters",
        "string.min": "content must be at least 10 characters",
    }),

    existImages: Joi.string()
        .custom((value, helpers) => {
            let images;
            if (value !== "null") {
                try {
                    images = JSON.parse(value);
                } catch {
                    return helpers.error("existImages.invalidJson");
                }
            } else {
                return [];
            }

            if (!Array.isArray(images)) {
                return helpers.error("existImages.array");
            }

            if (!images.every((image) => typeof image === "string")) {
                return helpers.error("existImages.string");
            }

            return images;
        })
        .messages({
            "existImages.invalidJson": "existImages must be valid JSON",
            "existImages.array": "existImages must be an array",
            "existImages.string": "existImages must contain only strings",
        }),

    deleteVideo: Joi.string()
        .trim()
        .valid("true", "false")
        .custom((value, helpers) => {
            return value === "true";
        })
        .message({
            "string.valid": "delete video has to be boolean",
        }),

    location: locationSchema,
    city: Joi.string().trim().invalid("null").messages({
        "string.base": "city has to be string",
    }),

    neighbourhood: Joi.string().trim().allow("", null).messages({
        "string.base": "neighbourhood has to be string",
    }),

    address: Joi.string().trim().messages({
        "string.base": "address has to be string",
        "string.empty": "address required",
    }),

    options: optionsSchema,
})
    .min(1)
    .unknown(false);

const deletePostValidation = Joi.object({
    postId: objectId("invalid post id"),
}).unknown(false);

module.exports = {
    getPostsValidation,
    getPostByIdValidation,
    createPostValidation,
    updatePostParamsValidation,
    updatePostBodyValidation,
    deletePostValidation,
};
