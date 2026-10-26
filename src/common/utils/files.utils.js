const { fileTypeFromFile } = require("file-type");
const HttpErrors = require("http-errors");
const fs = require("fs/promises");
const path = require("path");

const toFileList = (uploaded) => {
    if (!uploaded) return [];
    if (uploaded.fieldname) return [uploaded];
    return Object.values(uploaded).flat();
};

const validateFileSizes = (files) => {
    const maxSizes = {
        images: 1 * 1024 * 1024,
        video: 50 * 1024 * 1024,
        icon: 500 * 1024,
    };

    for (const file of toFileList(files)) {
        const max = maxSizes[file.fieldname];
        if (max && file.size > max) {
            const error = new Error("File size is too large");
            error.code = "LIMIT_FILE_SIZE";
            error.field = file.fieldname;
            throw error;
        }
    }
};

const validateRealFileTypes = async (files) => {
    const allowedTypes = {
        images: ["image/jpeg", "image/png", "image/webp"],
        icon: ["image/jpeg", "image/png", "image/webp"],
        video: ["video/mp4", "video/webm"],
    };

    for (const file of toFileList(files)) {
        const type = await fileTypeFromFile(file.path);

        if (!type) {
            throw new HttpErrors.BadRequest("Could not determine file type");
        }
        const allowed = allowedTypes[file.fieldname];
        if (!allowed) {
            throw new HttpErrors.BadRequest("Unexpected file field");
        }

        if (!allowed.includes(type.mime)) {
            throw new HttpErrors.BadRequest(`Invalid ${file.fieldname} file`);
        }

        if (type.mime !== file.mimetype) {
            throw new HttpErrors.BadRequest(
                "File content does not match its type",
            );
        }
    }
};

const moveFiles = async (source, files, destination) => {
    const moved = [];
    try {
        for (const file of files) {
            const sourcePath = path.join(source, file);
            const destinationPath = path.join(destination, file);
            await fs.rename(sourcePath, destinationPath);
            moved.push({ source: sourcePath, destination: destinationPath });
        }
    } catch (error) {
        for (const file of moved) {
            try {
                await fs.rename(file.destination, file.source);
            } catch (rollbackError) {
                console.log(rollbackError);
            }
        }
        if (error.code === "ENOENT") {
            throw new Error("File not found during move operation");
        }
        throw error;
    }
};

const removeDirectory = async (directory) => {
    await fs.rm(directory, {
        recursive: true,
        force: true,
    });
};

module.exports = {
    validateFileSizes,
    validateRealFileTypes,
    moveFiles,
    removeDirectory,
};
