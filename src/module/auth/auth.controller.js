const authMessage = require("./auth.message");
const authService = require("./auth.service");
const ms = require("ms");
class authController {
    #service;
    constructor() {
        this.#service = authService;
    }

    send_OTP = async (requset, response, next) => {
        try {
            let { mobile } = requset.body;
            const result = await this.#service.send_OTP(mobile);
            return response.status(200).json({ message: authMessage.sentOTP });
        } catch (error) {
            return next(error);
        }
    };

    check_OTP = async (requset, response, next) => {
        try {
            const { mobile, code } = requset.body;
            const { accessToken, refreshToken } = await this.#service.check_OTP(
                mobile,
                code,
            );

            response.cookie("access_token", accessToken, {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: ms(process.env.JWT_ACCESS_TOKEN_EXPIRE),
            });
            response.cookie("refresh_token", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: ms(process.env.JWT_REFRESH_TOKEN_EXPIRE),
            });
            return response.status(200).json({
                message: authMessage.loggedIn,
            });
        } catch (error) {
            return next(error);
        }
    };

    refreshAccessToken = async (request, response, next) => {
        try {
            const refreshToken = request.cookies?.refresh_token;

            const accessToken =
                await authService.refreshAccessToken(refreshToken);

            response.cookie("access_token", accessToken, {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: ms(process.env.JWT_ACCESS_TOKEN_EXPIRE),
            });

            return response.status(200).json({
                message: "access token refreshed successfully",
            });
        } catch (error) {
            next(error);
        }
    };

    logout = (request, response, next) => {
        try {
            const { userId } = request.user;
            this.#service.logout(userId);
            response.clearCookie("access_token", {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
            });
            response.clearCookie("refresh_token", {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
            });

            response.status(200).json({ message: authMessage.loggedOut });
        } catch (error) {
            next(error);
        }
    };
}

module.exports = new authController();
