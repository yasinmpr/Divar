const { verifyLogin } = require("../../common/jwt/jwt.middleware");
const validate = require("../../common/middleware/validation.middleware");
const { sendOTPValidation, checkOTPValidation } = require("./auth.validation");
const authController = require("./auth.controller");
const {
    sendOtpLimiter,
    sendOtpMobileLimiter,
    checkOtpLimiter,
    checkOtpMobileLimiter,
} = require("../../common/middleware/rateLimit");

const router = require("express").Router();

router.post(
    "/send-otp",
    sendOtpLimiter,
    validate(sendOTPValidation),
    sendOtpMobileLimiter,
    authController.send_OTP,
);
router.post(
    "/check-otp",
    checkOtpLimiter,
    validate(checkOTPValidation),
    checkOtpMobileLimiter,
    authController.check_OTP,
);
router.get("/logout", verifyLogin, authController.logout);
router.get("/refresh", authController.refreshAccessToken);

module.exports = router;
