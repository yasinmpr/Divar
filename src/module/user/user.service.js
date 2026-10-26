const userModel = require("./user.model");
const httpErrors = require("http-errors");

class userService {
    #model = userModel;

    profile = async (userId) => {
        try {
            const user = await this.#model
                .findOne(
                    { _id: userId },
                    { fullName: 1, mobile: 1, role: 1, createdAt: 1 },
                )
                .lean();

            if (!user) {
                throw new httpErrors.NotFound("user not found");
            }

            return user;
        } catch (error) {
            throw error;
        }
    };
}

module.exports = new userService();
