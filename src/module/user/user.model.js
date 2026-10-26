const { Schema, model } = require("mongoose");

const OTPSchema = new Schema({
    code: { type: String, required: false, default: "" },
    expired_in: { type: Number, required: false, default: 0 },
    attempt_number: { type: Number, default: 0 },
});

const UserSchema = new Schema(
    {
        fullName: { type: String, default: "" },
        mobile: { type: String, required: true, unique: true },
        otp: { type: OTPSchema },
        otp_locked_until: { type: Number, default: 0 },
        verified_mobile: { type: Boolean, default: false },
        role: {
            type: String,
            default: "user",
            required: true,
            enum: ["admin", "user"],
        },
        token: { type: String, default: "" },
    },
    { timestamps: true },
);

const userModel = model("user", UserSchema);

module.exports = userModel;
