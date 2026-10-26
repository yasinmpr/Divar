const httpCode = require("http-status-codes");

const optionService = require("./option.service");

class OptionController {
    #service;

    constructor() {
        this.#service = optionService;
    }

    createOption = async (request, response, next) => {
        try {
            const { title, key, type, values, categoryId, guid, required } =
                request.body;
            const result = await this.#service.createOption({
                title,
                key,
                type,
                values,
                guid,
                required,
                categoryId,
            });
            response
                .status(httpCode.StatusCodes.CREATED)
                .json("new option created successfully");
        } catch (error) {
            next(error);
        }
    };

    getOptionById = async (request, response, next) => {
        try {
            const { optionId } = request.params;
            const result = await this.#service.getOptionById(optionId);
            response.status(httpCode.StatusCodes.OK).json(result);
        } catch (error) {
            next(error);
        }
    };

    getOptionsByCategorySlug = async (request, response, next) => {
        try {
            const { categorySlug } = request.params;
            const result =
                await this.#service.getOptionsByCategorySlug(categorySlug);

            response
                .status(httpCode.StatusCodes.OK)
                .json({ category: categorySlug, options: result });
        } catch (error) {
            next(error);
        }
    };
    getOptionsByCategoryId = async (request, response, next) => {
        try {
            const { categoryId } = request.params;
            const result =
                await this.#service.getOptionsByCategoryId(categoryId);

            response
                .status(httpCode.StatusCodes.OK)
                .json({ category: categoryId, options: result });
        } catch (error) {
            next(error);
        }
    };
    deleteOptionById = async (request, response, next) => {
        try {
            const { optionId } = request.params;

            const result = await this.#service.deleteOptionById(optionId);
            response
                .status(httpCode.StatusCodes.OK)
                .json("option deleted successfully");
        } catch (error) {
            next(error);
        }
    };
    updateOptionById = async (request, response, next) => {
        try {
            const { optionId } = request.params;
            const { title, key, type, values, required, guid } = request.body;

            await this.#service.updateOptionById(optionId, {
                title,
                key,
                type,
                values,
                required,
                guid,
            });
            response
                .status(httpCode.StatusCodes.OK)
                .json("option updated successfully");
        } catch (error) {
            next(error);
        }
    };
}

module.exports = new OptionController();
