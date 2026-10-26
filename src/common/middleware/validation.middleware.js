const validate = (schema, property = "body") => {
    return (request, response, next) => {
        const { error, value } = schema.validate(request[property] ?? {}, {
            abortEarly: false,
            convert: true,
            allowUnknown: false,
        });

        if (error) {
            return next(error);
        }

        if (property === "query") {
            request.validatedQuery = value;
        } else {
            request[property] = value;
        }

        next();
    };
};

module.exports = validate;
