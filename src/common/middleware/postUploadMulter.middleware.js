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
            "new",
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
    if (file.fieldname === "images") {
        const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

        if (!allowedImageTypes.includes(file.mimetype)) {
            return cb(new httpErrors.BadRequest("invalid image file"));
        }

        return cb(null, true);
    }

    if (file.fieldname === "video") {
        const allowedVideoTypes = ["video/mp4", "video/webm"];

        if (!allowedVideoTypes.includes(file.mimetype)) {
            return cb(new httpErrors.BadRequest("invalid video file"));
        }

        return cb(null, true);
    }

    cb(new httpErrors.BadRequest("invalid filds"));
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024,
    },
});

module.exports = upload;
