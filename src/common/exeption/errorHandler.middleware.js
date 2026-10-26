const multerError = require("multer").MulterError;
const path = require("path");
const { removeDirectory } = require("../utils/files.utils");

const errorHandler = (err, req, res, next) => {
    if (req.uploadId) {
        removeDirectory(
            path.join(process.cwd(), "uploads", "temp", req.uploadId),
        ).catch((e) => console.error("Failed to cleanup temp files:", e));
    }

    let statusCode = 500;
    let type = "InternalServerError";
    let message = "Internal server error";

    // file size error
    if (err.code === "LIMIT_FILE_SIZE") {
        statusCode = 413;
        type = "PayloadTooLargeError";

        if (err.field === "images") {
            message = "Each image must be smaller than 1 MB";
        } else if (err.field === "video") {
            message = "Video must be smaller than 50 MB";
        } else if (err.field === "icon") {
            message = "Icon must be smaller than 500 KB";
        } else {
            message = "File size is too large";
        }
    }

    // files other errors
    else if (err instanceof multerError) {
        statusCode = 400;
        type = "BadRequestError";
        message = err.message;
    }

    // http-errors
    else if (err.statusCode >= 400 && err.statusCode < 600) {
        statusCode = err.statusCode;
        type = err.name || "HttpError";
        message = err.message;
    }

    // Mongoose CastError
    else if (err.name === "CastError") {
        statusCode = 400;
        type = "BadRequestError";
        message = `Invalid ${err.path}`;
    }

    // Mongoose ValidationError
    else if (err.name === "ValidationError") {
        statusCode = 400;
        type = "ValidationError";
        message = err.message;
    }

    // Mongo duplicate key
    else if (err.code === 11000) {
        statusCode = 409;
        type = "ConflictError";
        message = "A resource with the same unique value already exists";
    }

    // unexpected error
    if (statusCode >= 500) {
        console.error(err);
    }

    res.status(statusCode).json({
        statusCode,
        type,
        message,
    });
};

module.exports = errorHandler;
