const authMessage = Object.freeze({
    otpNotExpired: "OTP code sent before please try again later",
    sentOTP: "OTP sent succsesfully",
    userNotFound: "User not found",
    wrongOTP: "OTP code is not valid",
    otpExpired: "OTP code is expired",
    loggedIn: "you have successfully logged in",
    accessTokenNotFound: "Access token not found",
    refreshTokenNotFound: "Refresh token not found",
    loggedOut: "you have successfully logged out",
    tooManyAttempts: "too many attempts! try again later",
});

module.exports = authMessage;
