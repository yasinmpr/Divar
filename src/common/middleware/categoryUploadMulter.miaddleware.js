const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const httpErrors = require("http-errors");
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(
            process.cwd(),
            "uploads",
            "temp",
            req.uploadId.toString(),
        );
        try {
            await fs.mkdir(uploadDir, { recursive: true });

            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);

        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

        cb(null, filename);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new httpErrors.BadRequest("invalid icon file"));
    }

    cb(null, true);
};

const uploadCategoryIcon = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 500 * 1024,
    },
});

module.exports = uploadCategoryIcon;
