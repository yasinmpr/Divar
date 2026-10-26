const { rateLimit } = require("express-rate-limit");
const httpErrors = require("http-errors");

const createRateLimiter = ({ windowMs, limit, message, keyGenerator }) => {
    return rateLimit({
        windowMs,
        limit,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, next) => {
            next(new httpErrors.TooManyRequests(message));
        },
        ...(keyGenerator && { keyGenerator }),
    });
};

const globalLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    message: "too many requests. try again later",
});

const sendOtpLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    limit: 5,
    message: "too many otp requests. try again later",
});

const checkOtpLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    limit: 10,
    message: "too many otp verification attempts. try again later",
});

const sendOtpMobileLimiter = createRateLimiter({
    windowMs: 2 * 60 * 1000,
    limit: 1,
    message: "too many otp requests. try again later",
    keyGenerator: (req) => `otp-send-mobile:${req.body.mobile}`,
});

const checkOtpMobileLimiter = createRateLimiter({
    windowMs: 30 * 60 * 1000,
    limit: 10,
    message: "too many otp verification attempts. try again later",
    keyGenerator: (req) => `otp-verify-mobile:${req.body.mobile}`,
});

const adMutationLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    message: "too many ad modification requests. try again later",
    keyGenerator: (req) => `ad-mutation:${req.user.userId}`,
});

module.exports = {
    globalLimiter,
    sendOtpLimiter,
    checkOtpLimiter,
    sendOtpMobileLimiter,
    checkOtpMobileLimiter,
    adMutationLimiter,
};
