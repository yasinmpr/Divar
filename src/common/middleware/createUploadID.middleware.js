const crypto = require("crypto");

const createUploadId = (req, res, next) => {
    req.uploadId = crypto.randomUUID();
    next();
};

module.exports = createUploadId;
