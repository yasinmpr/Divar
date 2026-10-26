const crypto = require("crypto");

const hashOtp = (code) =>
    crypto
        .createHmac("sha256", process.env.OTP_SECRET)
        .update(String(code))
        .digest("hex");

const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

const safeEqual = (a, b) =>
    typeof a === "string" &&
    typeof b === "string" &&
    a.length === b.length &&
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

module.exports = { hashOtp, hashToken, safeEqual };
