const path = require("node:path");

const {
    validateFileSizes,
    validateRealFileTypes,
    removeDirectory,
} = require("../utils/files.utils");

const runMulter = (uploadMiddleware, request, response) => {
    return new Promise((resolve, reject) => {
        uploadMiddleware(request, response, (error) => {
            if (error) {
                return reject(error);
            }
            resolve();
        });
    });
};

const handleUpload = (uploadMiddleware) => {
    return async (request, response, next) => {
        try {
            await runMulter(uploadMiddleware, request, response);
            const files = request.file ?? request.files;
            await validateRealFileTypes(files);
            validateFileSizes(files);
            next();
        } catch (error) {
            try {
                const tempDirectory = path.join(
                    process.cwd(),
                    "uploads",
                    "temp",
                    request.uploadId,
                );
                await removeDirectory(tempDirectory);
            } catch (cleanupError) {
                console.error("Failed to cleanup temp files:", cleanupError);
            }
            next(error);
        }
    };
};

module.exports = handleUpload;
