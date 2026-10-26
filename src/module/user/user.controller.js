const userService = require("./user.service");

class userController {
    #service = userService;
    constructor() {}

    profile = async (request, response, next) => {
        try {
            const result = await this.#service.profile(request.user.userId);
            response.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };
}

module.exports = new userController();
