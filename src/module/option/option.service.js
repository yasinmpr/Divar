const httpErrors = require("http-errors");
const slugify = require("slugify");
const optionModel = require("./option.model");
const postModel = require("../post/post.model");
const categoryService = require("../category/category.service");
const { isObjectIdOrHexString } = require("mongoose");

class OptionService {
    #model;
    #categoryService;
    #postModel;

    constructor() {
        this.#model = optionModel;
        this.#categoryService = categoryService;
        this.#postModel = postModel;
    }

    createOption = async (newOptionData) => {
        const optionData = { ...newOptionData };
        const finalData = {};
        // ============================================================
        // categoryId
        // ============================================================
        await this.#categoryService.checkExistById(optionData.categoryId);

        if (!(await this.#categoryService.isLeaf(optionData.categoryId))) {
            throw new httpErrors.BadRequest(
                "Options can only be added to leaf categories",
            );
        }
        finalData.categoryId = optionData.categoryId;

        // ============================================================
        // required
        // ============================================================
        finalData.required = optionData.required;

        // ============================================================
        // key
        // ============================================================
        optionData.key = slugify(optionData.key, {
            lower: true,
            trim: true,
            replacement: "_",
        });
        if (!optionData.key) {
            throw new httpErrors.BadRequest("Invalid option key");
        }
        await this.#checkExistByKey(optionData.key, optionData.categoryId);

        finalData.key = optionData.key;

        // ============================================================
        // title
        // ============================================================
        if (!optionData.title) {
            throw new httpErrors.BadRequest("invalid option title");
        }

        finalData.title = optionData.title;

        // ============================================================
        // guid
        // ============================================================
        if ([undefined, null, "null"].includes(optionData.guid)) {
            optionData.guid = null;
        }
        finalData.guid = optionData.guid;

        // ============================================================
        // type
        // ============================================================
        //validate in joi
        finalData.type = optionData.type;

        // ============================================================
        // values
        // ============================================================
        const hasValues = optionData.values.length > 0;

        if (
            (optionData.type === "selection" ||
                optionData.type === "multiple") &&
            !hasValues
        ) {
            throw new httpErrors.BadRequest(
                `${optionData.type} type needs values`,
            );
        }

        if (
            optionData.type !== "selection" &&
            optionData.type !== "multiple" &&
            hasValues
        ) {
            throw new httpErrors.BadRequest(
                "only selection and multiple types can have values",
            );
        }

        if (hasValues) {
            optionData.values = [...new Set(optionData.values)];
        }

        if (
            (optionData.type === "selection" ||
                optionData.type === "multiple") &&
            hasValues
        ) {
            const firstType = typeof optionData.values[0];

            if (firstType !== "string" && firstType !== "number") {
                throw new httpErrors.BadRequest("Invalid value type");
            }

            if (
                !optionData.values.every((value) => typeof value === firstType)
            ) {
                throw new httpErrors.BadRequest(
                    "all option values must have the same type",
                );
            }
        }

        finalData.values = optionData.values;

        // ============================================================
        // create
        // ============================================================

        const newOption = await this.#model.create(finalData);
        if (!newOption) {
            throw new httpErrors.InternalServerError(
                "option create failed, please try again",
            );
        }
        return newOption;
    };

    getOptionById = async (optionId) => {
        try {
            const option = await this.#checkExistById(optionId);
            return option;
        } catch (error) {
            throw error;
        }
    };
    getOptionsByCategoryId = async (categoryId) => {
        const options = await this.#model
            .find({ categoryId }, { __v: 0 })
            .lean();
        return options;
    };

    getOptionsByCategorySlug = async (categorySlug) => {
        const categoryId =
            await this.#categoryService.getIdFromSlug(categorySlug);

        const categoryOptions = await this.getOptionsByCategoryId(categoryId);
        const resultOptions = categoryOptions.map((option) => {
            const newOption = {
                title: option.title,
                key: option.key,
                type: option.type,
                required: option.required,
            };
            if (["selection", "multiple"].includes(option.type)) {
                newOption.values = option.values;
            }
            return newOption;
        });
        return resultOptions;
    };

    deleteOptionById = async (optionId) => {
        // ============================================================
        // optionId
        // ============================================================
        await this.#checkExistById(optionId);

        if (await this.#postModel.exists({ "options.optionId": optionId })) {
            throw new httpErrors.Conflict(
                "option is used in some posts, cannot be deleted",
            );
        }
        // ============================================================
        // delete
        // ============================================================
        const result = await this.#model.deleteOne({ _id: optionId });
        if (result.deletedCount === 0) {
            throw new httpErrors.InternalServerError(
                "option delete failed, please try again",
            );
        }
        return result.deletedCount;
    };
    updateOptionById = async (optionId, optionUpdatedData) => {
        const optionData = { ...optionUpdatedData };
        const finalData = {};
        let keyChanged = false;
        let typeChanged = false;
        let sendValues = false;

        // ============================================================
        // optionId
        // ============================================================
        const option = await this.#checkExistById(optionId);

        // ============================================================
        // key
        // ============================================================
        if (optionData.key !== undefined) {
            optionData.key = slugify(optionData.key, {
                lower: true,
                trim: true,
                replacement: "_",
            });

            if (!optionData.key) {
                throw new httpErrors.BadRequest(
                    "new key is not valid for an option",
                );
            }
            if (optionData.key !== option.key) {
                finalData.key = optionData.key;
                keyChanged = true;
            }
        }

        if (keyChanged) {
            await this.#checkExistByKey(finalData.key, option.categoryId);
        }

        // ============================================================
        // title
        // ============================================================

        if (optionData.title !== undefined) {
            if (!optionData.title) {
                throw new httpErrors.BadRequest("invalid option title");
            }
            finalData.title = optionData.title;
        }

        // ============================================================
        // guid
        // ============================================================

        if (optionData.guid !== undefined) {
            if ([null, "null"].includes(optionData.guid)) {
                optionData.guid = null;
            }
            finalData.guid = optionData.guid;
        }

        // ============================================================
        // required
        // ============================================================

        if (optionData.required !== undefined) {
            if (optionData.required !== option.required) {
                finalData.required = optionData.required;
            }
        }

        // ============================================================
        // type
        // ============================================================
        if (optionData.type !== undefined) {
            const optionTypes = [
                "string",
                "number",
                "boolean",
                "selection",
                "multiple",
            ];
            if (!optionTypes.includes(optionData.type)) {
                throw new httpErrors.BadRequest("invalid option type");
            }
            if (option.type !== optionData.type) {
                finalData.type = optionData.type;
                typeChanged = true;
            }
        }

        // ============================================================
        // values
        // ============================================================

        if (optionData.values !== undefined) {
            sendValues = true;
        }

        const choice_types = ["selection", "multiple"];
        const type = finalData.type ? finalData.type : option.type;
        const values = sendValues ? optionData.values : option.values;
        const hasValues = values.length > 0;

        if (choice_types.includes(type) && !hasValues) {
            throw new httpErrors.BadRequest(`${type} type needs values`);
        }

        if (!choice_types.includes(type) && hasValues) {
            throw new httpErrors.BadRequest(
                "only selection and multiple types can have values",
            );
        }

        if (sendValues) {
            if (choice_types.includes(type)) {
                optionData.values = [...new Set(optionData.values)];
                const firstType = typeof optionData.values[0];
                if (firstType !== "string" && firstType !== "number") {
                    throw new httpErrors.BadRequest("Invalid value type");
                }

                if (
                    !optionData.values.every(
                        (value) => typeof value === firstType,
                    )
                ) {
                    throw new httpErrors.BadRequest(
                        "all option values must have the same type",
                    );
                }
            }
        } else {
            optionData.values = option.values;
        }
        finalData.values = optionData.values;

        // ============================================================
        // update
        // ============================================================
        if (
            (typeChanged || keyChanged || sendValues) &&
            (await this.#postModel.exists({ "options.optionId": optionId }))
        ) {
            throw new httpErrors.Conflict(
                "option is used in some posts, cannot be updated",
            );
        }
        const result = await this.#model.updateOne(
            { _id: optionId },
            finalData,
        );

        return result.modifiedCount;
    };

    getPostFilterOptions = async (categoryId, filters) => {
        const categoryOptions = await this.getOptionsByCategoryId(categoryId);
        const validateOptions = [];
        const validateOptionId = [];

        if (categoryOptions.length === 0) return [];

        const optionsFilterMap = new Map(
            Object.keys(filters).map((key) => [key, filters[key]]),
        );

        // if the option key is in the filters, then add it to the validateOptions array
        //if multiple values for one key then just first value will be considered for validation
        for (const option of categoryOptions) {
            if (optionsFilterMap.has(option.key)) {
                if (!validateOptionId.includes(option._id)) {
                    validateOptionId.push(option._id);
                    validateOptions.push({
                        optionId: option._id,
                        type: option.type,
                        values: option.values,
                        value: optionsFilterMap.get(option.key),
                    });
                }
            }
        }

        return validateOptions;
    };

    #checkExistById = async (optionId) => {
        const option = await this.#model.findById(optionId, { __v: 0 }).lean();
        if (!option) {
            throw new httpErrors.NotFound("option not found");
        }
        return option;
    };

    #checkExistByKey = async (key, categoryId) => {
        const option = await this.#model
            .findOne({
                key,
                categoryId,
            })
            .lean();

        if (option) {
            throw new httpErrors.Conflict(
                "option with this key already exist for this category",
            );
        }
    };
}

module.exports = new OptionService();
