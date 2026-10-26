const jwt = require("jsonwebtoken");
const httpErrors = require("http-errors");
const jwtMessages = require("./jwt.messages");

const createAccessToken = (payload) => {
    const token = jwt.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRE,
    });
    return token;
};
const verifyAccessToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
        return decoded;
    } catch (err) {
        throw new httpErrors.Unauthorized(jwtMessages.invalidAccessToken);
    }
};

const createRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRE,
    });
};
const verifyRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_TOKEN_SECRET);
        return decoded;
    } catch (err) {
        throw new httpErrors.Unauthorized(jwtMessages.invalidRefreshToken);
    }
};
module.exports = {
    createAccessToken,
    verifyAccessToken,
    createRefreshToken,
    verifyRefreshToken,
};
