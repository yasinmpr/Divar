const userModel = require("../user/user.model");
const authMessage = require("./auth.message");
const httpErrors = require("http-errors");
const {
    createAccessToken,
    createRefreshToken,
    verifyRefreshToken,
} = require("../../common/jwt/jwt.service");
const { randomInt } = require("crypto");
const { hashOtp, safeEqual, hashToken } = require("./auth.utils");

class AuthService {
    #model;
    constructor() {
        this.#model = userModel;
    }

    send_OTP = async (mobile) => {
        const user = await this.#model.findOne({ mobile });
        const now = Date.now();
        const otpTime = 1000 * 60 * 2;

        if (user?.otp_locked_until > now) {
            throw new httpErrors.TooManyRequests(authMessage.tooManyAttempts);
        }
        const otpCode = String(randomInt(100000, 1000000));
        const otp = {
            code: hashOtp(otpCode),
            expired_in: now + otpTime,
            attempt_number: 0,
        };
        if (!user) {
            await this.#model.create({
                mobile,
                otp,
            });
        } else {
            if (user.otp?.code && user.otp.expired_in > now) {
                throw new httpErrors.BadRequest(authMessage.otpNotExpired);
            }
            await this.#model.updateOne({ mobile }, { $set: { otp } });
        }
        if (process.env.NODE_ENV === "development")
            console.log(`OTP ${mobile} : ${otpCode}`);
        return true;
    };

    check_OTP = async (mobile, code) => {
        const maxAttemptNumber = 5;
        const now = Date.now();
        const lockTime = 1000 * 60 * 15;

        const user = await this.#model
            .findOneAndUpdate(
                {
                    mobile,
                    otp_locked_until: { $not: { $gt: now } },
                    "otp.expired_in": { $gt: now },
                    "otp.attempt_number": { $lt: maxAttemptNumber },
                },
                { $inc: { "otp.attempt_number": 1 } },
                {
                    new: true,
                    projection: "mobile otp _id role verified_mobile",
                },
            )
            .lean();

        if (!user) {
            const locked = await this.#model.exists({
                mobile,
                otp_locked_until: { $gt: now },
            });
            if (locked) {
                throw new httpErrors.TooManyRequests(
                    authMessage.tooManyAttempts,
                );
            }

            throw new httpErrors.Unauthorized(authMessage.wrongOTP);
        }

        if (!safeEqual(user.otp.code, hashOtp(code))) {
            if (user.otp.attempt_number >= maxAttemptNumber) {
                await this.#model.updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            otp_locked_until: now + lockTime,
                            "otp.code": "",
                            "otp.expired_in": 0,
                        },
                    },
                );
                throw new httpErrors.TooManyRequests(
                    authMessage.tooManyAttempts,
                );
            }
            throw new httpErrors.Unauthorized(authMessage.wrongOTP);
        }

        const refreshToken = createRefreshToken({ userId: user._id });
        const hashedRefreshToken = hashToken(refreshToken);
        const used = await this.#model.findOneAndUpdate(
            { _id: user._id, "otp.code": user.otp.code },
            {
                $set: {
                    "otp.code": "",
                    "otp.expired_in": 0,
                    verified_mobile: true,
                    token: hashedRefreshToken,
                },
            },
        );
        if (!used) throw new httpErrors.Unauthorized(authMessage.wrongOTP);
        const accessToken = createAccessToken({
            mobile: user.mobile,
            userId: user._id,
            role: user.role,
        });
        return { accessToken, refreshToken };
    };

    refreshAccessToken = async (refreshToken) => {
        if (!refreshToken) {
            throw new httpErrors.Unauthorized(authMessage.refreshTokenNotFound);
        }

        const { userId } = verifyRefreshToken(refreshToken);

        const user = await this.#model
            .findOne({ _id: userId }, { mobile: 1, role: 1, token: 1 })
            .lean();

        const hashedRefreshToken = hashToken(refreshToken);

        if (!user || !safeEqual(user.token, hashedRefreshToken)) {
            throw new httpErrors.Unauthorized(authMessage.userNotFound);
        }

        const accessToken = createAccessToken({
            mobile: user.mobile,
            userId,
            role: user.role,
        });

        return accessToken;
    };

    logout = async (userId) => {
        const user = await this.#model.findOneAndUpdate(
            { _id: userId },
            { $set: { token: "" } },
            { new: true },
        );
    };
}

module.exports = new AuthService();
