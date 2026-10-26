const { verifyAccessToken } = require("./jwt.service");
const httpErrors = require("http-errors");
const authMessage = require("../../module/auth/auth.message");

const verifyLogin = (request, response, next) => {
    try {
        const authHeader = request.headers?.authorization;

        const token =
            request.cookies?.access_token ||
            (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);
        if (!token) {
            throw new httpErrors.Unauthorized(authMessage.accessTokenNotFound);
        }
        const payload = verifyAccessToken(token);
        request.user = payload;
        next();
    } catch (err) {
        next(err);
    }
};
const optionalAuth = (request, response, next) => {
    try {
        const authHeader = request.headers?.authorization;

        const token =
            request.cookies?.access_token ||
            (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);
        if (!token) {
            request.user = null;
            return next();
        }
        const payload = verifyAccessToken(token);
        request.user = payload;
        next();
    } catch (err) {
        next(err);
    }
};

const verifyAdmin = (request, response, next) => {
    try {
        const { role } = request.user;
        if (role !== "admin") {
            throw new httpErrors.Forbidden("only admin can access this api");
        }
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { verifyLogin, verifyAdmin, optionalAuth };
