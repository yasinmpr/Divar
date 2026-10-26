const Joi = require("joi");

const sendOTPValidation = Joi.object({
    mobile: Joi.string()
        .trim()
        .pattern(/^09\d{9}$/)
        .required()
        .messages({
            "any.required": "mobile is required",
            "string.empty": "mobile is required",
            "string.pattern.base": "invalid mobile number",
        }),
}).unknown(false);

const checkOTPValidation = Joi.object({
    mobile: Joi.string()
        .trim()
        .pattern(/^09\d{9}$/)
        .required()
        .messages({
            "any.required": "mobile is required",
            "string.empty": "mobile is required",
            "string.pattern.base": "invalid mobile number",
        }),

    code: Joi.string()
        .trim()
        .pattern(/^\d{6}$/)
        .required()
        .messages({
            "any.required": "OTP code is required",
            "string.empty": "OTP code is required",
            "string.pattern.base": "OTP code must be 6 digits",
        }),
}).unknown(false);
module.exports = {
    sendOTPValidation,
    checkOTPValidation,
};
