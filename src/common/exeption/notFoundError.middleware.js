const httpErrors = require("http-errors");

const notFoundError = (request, response, next) => {
    next(
        new httpErrors.NotFound(
            `${request.method} ${request.originalUrl} not found`,
        ),
    );
};

module.exports = notFoundError;
