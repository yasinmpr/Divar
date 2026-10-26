const HttpErrors = require("http-errors");
const postModel = require("./post.model");
const objectId = require("mongoose").Types.ObjectId;
const path = require("path");
const fs = require("fs/promises");

const categoryService = require("../category/category.service");
const optionService = require("../option/option.service");
const {
    moveFiles,
    removeDirectory,
} = require("../../common/utils/files.utils");

class PostService {
    #model;
    #categoryService;
    #optionService;

    constructor() {
        this.#model = postModel;
        this.#categoryService = categoryService;
        this.#optionService = optionService;
    }

    getPosts = async ({
        categorySlug,
        filters = {},
        optionFilters = {},
        pagination = {},
    }) => {
        // ============================================================
        // category
        // ============================================================

        let categoryId = null;

        categorySlug = ["null", null].includes(categorySlug)
            ? null
            : categorySlug;

        if (categorySlug !== undefined && categorySlug !== null) {
            categoryId = await this.#categoryService.getIdFromSlug(
                categorySlug.trim(),
            );
        }

        // ============================================================
        // base query
        // ============================================================

        const query = {};
        if (categoryId) {
            const categoryDescendantIds =
                await this.#categoryService.getDescendantIds(categoryId);
            query.categoryId = { $in: categoryDescendantIds };
        }

        // ============================================================
        // city
        // ============================================================
        // اگر city خالی باشد یا "iran" باشد:
        // هیچ فیلتر شهری روی query اعمال نمی‌کنیم.
        // بنابراین آگهی‌های همه شهرها برمی‌گردند.
        // ============================================================

        filters.city = ["null", null].includes(filters.city)
            ? null
            : filters.city;
        if (
            filters.city !== undefined &&
            filters.city !== null &&
            filters.city !== ""
        ) {
            if (filters.city && filters.city !== "iran") {
                query.city = filters.city;
            }
        }

        // ============================================================
        // neighbourhood
        // ============================================================
        filters.neighbourhood = ["null", null].includes(filters.neighbourhood)
            ? null
            : filters.neighbourhood;
        if (
            filters.neighbourhood !== undefined &&
            filters.neighbourhood !== null &&
            filters.neighbourhood !== ""
        ) {
            if (!filters.neighbourhood) {
                throw new HttpErrors.BadRequest("invalid neighbourhood");
            }
            query.neighbourhood = filters.neighbourhood;
        }

        // ============================================================
        // hasVideo
        // ============================================================

        if (filters.hasVideo !== undefined) {
            if (filters.hasVideo === "true" || filters.hasVideo === true) {
                query.video = {
                    $exists: true,
                    $ne: null,
                };
            }
        }

        // ============================================================
        // publishedAfter
        // ============================================================
        filters.publishedAfter = ["null", null].includes(filters.publishedAfter)
            ? null
            : filters.publishedAfter;

        const postedTimeFilter = {
            "3hours-ago": 3 * 60 * 60 * 1000,
            "12hours-ago": 12 * 60 * 60 * 1000,
            "1day-ago": 1 * 24 * 60 * 60 * 1000,
            "3days-ago": 3 * 24 * 60 * 60 * 1000,
            "7days-ago": 7 * 24 * 60 * 60 * 1000,
        };
        if (
            filters.publishedAfter !== undefined &&
            filters.publishedAfter !== null &&
            filters.publishedAfter !== ""
        ) {
            const timeAgo = postedTimeFilter[filters.publishedAfter];
            const publishedAfter = new Date(Date.now() - timeAgo);
            query.createdAt = {
                ...(query.createdAt || {}),
                $gte: publishedAfter,
            };
        }

        // ============================================================
        // validate option filters
        // ============================================================

        if (Object.keys(optionFilters).length > 0) {
            if (!categoryId) {
                throw new HttpErrors.BadRequest(
                    "category is required when using option filters",
                );
            }

            const postFilterOptions =
                await this.#optionService.getPostFilterOptions(
                    categoryId,
                    optionFilters,
                );

            // ========================================================
            // build option query
            // ========================================================

            if (await this.#categoryService.isLeaf(categoryId)) {
                const optionQuery =
                    await this.#buildPostFilterQuery(postFilterOptions);

                Object.assign(query, optionQuery);
            }
        }

        // ============================================================
        // pagination
        // ============================================================

        let page = 1;
        let limit = 20;

        if (
            pagination.page !== undefined &&
            pagination.page !== null &&
            pagination.page !== ""
        ) {
            page = Number(pagination.page);
        }

        if (
            pagination.limit !== undefined &&
            pagination.limit !== null &&
            pagination.limit !== ""
        ) {
            limit = Number(pagination.limit);
        }

        // ============================================================
        // sort
        // ============================================================

        const allowedSorts = {
            latest: { createdAt: -1, _id: -1 },
            oldest: { createdAt: 1, _id: 1 },
        };

        let sort = "latest";

        if (
            pagination.sort !== undefined &&
            pagination.sort !== null &&
            pagination.sort !== ""
        ) {
            sort = pagination.sort;
        }

        // ============================================================
        // query
        // ============================================================

        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
            this.#model
                .find(query)
                .sort(allowedSorts[sort])
                .skip(skip)
                .limit(limit)
                .lean(),

            this.#model.countDocuments(query),
        ]);

        // ============================================================
        // response
        // ============================================================

        return {
            posts,

            pagination: {
                page,
                limit,
                total,

                hasNextPage: skip + posts.length < total,
            },
        };
    };

    #buildPostFilterQuery = async (filterdOptions = []) => {
        const conditions = [];
        for (const option of filterdOptions) {
            const value = String(option.value).trim();
            const { values, type, optionId } = option;

            let valueQuery;

            switch (type) {
                // ========================================================
                // number
                // ========================================================

                case "number": {
                    const numberPattern = /^\d+(?:\.\d+)?$/;
                    const rangePattern = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/;
                    const minPattern = /^(\d+(?:\.\d+)?)-$/;
                    const maxPattern = /^-(\d+(?:\.\d+)?)$/;

                    if (numberPattern.test(value)) {
                        valueQuery = Number(value);
                    } else if (rangePattern.test(value)) {
                        const [, min, max] = value.match(rangePattern);

                        const minValue = Number(min);
                        const maxValue = Number(max);

                        if (minValue > maxValue) {
                            break;
                        }

                        valueQuery = {
                            $gte: minValue,
                            $lte: maxValue,
                        };
                    } else if (minPattern.test(value)) {
                        valueQuery = {
                            $gte: Number(value.slice(0, -1)),
                        };
                    } else if (maxPattern.test(value)) {
                        valueQuery = {
                            $lte: Number(value.slice(1)),
                        };
                    } else {
                        break;
                    }

                    conditions.push({
                        options: {
                            $elemMatch: {
                                optionId,
                                value: valueQuery,
                            },
                        },
                    });

                    break;
                }
                // ========================================================
                // string
                // ========================================================

                case "string": {
                    if (value) {
                        conditions.push({
                            options: {
                                $elemMatch: {
                                    optionId,
                                    value,
                                },
                            },
                        });
                    }
                    break;
                }

                // ========================================================
                // boolean
                // ========================================================

                case "boolean": {
                    if (value === "true" || value === "false") {
                        valueQuery = value === "true";
                        conditions.push({
                            options: {
                                $elemMatch: {
                                    optionId,
                                    value: valueQuery,
                                },
                            },
                        });
                    }
                    break;
                }
                case "selection":
                case "multiple": {
                    if (!value) {
                        break;
                    }

                    const valueType = typeof values[0];
                    let isValid = true;
                    const selectedValues = value.split(",").map((item) => {
                        item = item.trim();

                        if (item === "") {
                            isValid = false;
                            return item;
                        }

                        if (valueType === "number") {
                            const numberValue = Number(item);

                            if (!Number.isFinite(numberValue)) {
                                isValid = false;
                                return item;
                            }

                            if (!values.includes(numberValue)) {
                                isValid = false;
                            }

                            return numberValue;
                        }

                        if (!values.includes(item)) {
                            isValid = false;
                        }

                        return item;
                    });

                    if (isValid) {
                        if (type === "selection") {
                            conditions.push({
                                options: {
                                    $elemMatch: {
                                        optionId,
                                        value: {
                                            $in: selectedValues,
                                        },
                                    },
                                },
                            });
                        } else {
                            conditions.push({
                                options: {
                                    $elemMatch: {
                                        optionId,
                                        value: {
                                            $all: selectedValues,
                                        },
                                    },
                                },
                            });
                        }
                    }

                    break;
                }
            }
        }
        if (conditions.length === 0) {
            return {};
        }

        if (conditions.length === 1) {
            return conditions[0];
        }

        return {
            $and: conditions,
        };
    };

    getPostById = async (postId) => {
        const post = await this.#model.findById(postId).lean();
        if (!post) throw new HttpErrors.NotFound("post not found");
        return post;
    };

    createPost = async (userId, post, uploadId) => {
        // check if needs to verify userId
        const postData = { ...post };
        const newPost = {};
        const postId = new objectId().toString().toLowerCase();
        const files = [];
        const postDirectory = path.join(
            process.cwd(),
            "uploads",
            "posts",
            postId,
        );
        const tempDirectory = path.join(
            process.cwd(),
            "uploads",
            "temp",
            uploadId.toString(),
            "new",
        );
        let postDirectoryCreated = false;

        try {
            // ============================================================
            //  userId
            // ============================================================
            newPost.userId = userId;
            // ============================================================
            //  title
            // ============================================================

            newPost.title = postData.title;

            // ============================================================
            //  content
            // ============================================================

            newPost.content = postData.content;

            // ============================================================
            //  category id
            // ============================================================

            if (postData.categorySlug === "null")
                throw new HttpErrors.BadRequest("category slug required");
            const categoryId = await this.#categoryService.getIdFromSlug(
                postData.categorySlug,
            );
            if (!(await this.#categoryService.isLeaf(categoryId))) {
                throw new HttpErrors.BadRequest(
                    "only leaf category can have post",
                );
            }
            newPost.categoryId = categoryId;

            // ============================================================
            //  images
            // ============================================================

            if (postData.images === undefined || postData.images === null)
                throw new HttpErrors.BadRequest("post images required");
            if (!Array.isArray(postData.images))
                throw new HttpErrors.BadRequest("images must be an array");
            if (postData.images.length < 1)
                throw new HttpErrors.BadRequest(
                    "at least one image is required",
                );

            for (const image of postData.images) {
                if (
                    !image ||
                    typeof image !== "object" ||
                    !image.filename ||
                    !image.path
                ) {
                    throw new HttpErrors.BadRequest("invalid image file");
                }
                files.push(image.filename);
            }

            newPost.images = postData.images.map(
                (image) =>
                    `/uploads/posts/${postId.toString()}/${image.filename}`,
            );
            // ============================================================
            //  video
            // ============================================================

            if (postData.video === undefined || postData.video === null) {
                newPost.video = null;
            } else {
                if (
                    !postData.video ||
                    typeof postData.video !== "object" ||
                    Array.isArray(postData.video) ||
                    !postData.video.filename ||
                    !postData.video.path
                )
                    throw new HttpErrors.BadRequest("invalid video file");

                newPost.video = `/uploads/posts/${postId.toString()}/${postData.video.filename}`;
                files.push(postData.video.filename);
            }

            // ============================================================
            //  location
            // ============================================================

            const { lng, lat } = postData.location;
            newPost.location = {
                type: "Point",
                coordinates: [lng, lat],
            };

            // ============================================================
            //  city
            // ============================================================

            if (!postData.city)
                throw new HttpErrors.BadRequest("city is not valid");
            newPost.city = postData.city;

            // ============================================================
            //  neighbourhood
            // ============================================================

            if (
                [null, "null", undefined, ""].includes(postData.neighbourhood)
            ) {
                newPost.neighbourhood = null;
            } else {
                newPost.neighbourhood = postData.neighbourhood;
            }

            // ============================================================
            //  address
            // ============================================================
            if (!postData.address)
                throw new HttpErrors.BadRequest("address required");

            newPost.address = postData.address;

            // ============================================================
            //  options
            // ============================================================

            const options =
                await this.#optionService.getOptionsByCategoryId(categoryId);

            const sent = postData.options ?? {};
            if (options.length === 0 && Object.keys(sent).length > 0) {
                throw new HttpErrors.BadRequest("post doesnt nead any options");
            }

            const validOptionKeys = new Set(
                options.map((option) => option.key),
            );
            for (const key of Object.keys(sent)) {
                if (!validOptionKeys.has(key)) {
                    throw new HttpErrors.BadRequest(`invalid option ${key}`);
                }
            }

            newPost.options = [];
            for (const option of options) {
                const hasOption = Object.prototype.hasOwnProperty.call(
                    sent,
                    option.key,
                );

                let value = sent[option.key];

                if (
                    !option.required &&
                    (!hasOption || value === null || value === undefined)
                ) {
                    // optional option that user didn't send or send null or undefined
                    newPost.options.push({
                        optionId: option._id,
                        value: null,
                    });
                    continue;
                } else if (
                    option.required &&
                    (!hasOption || value === null || value === undefined)
                )
                    // required option that user didn't send or send null or undefined
                    throw new HttpErrors.BadRequest(
                        `option ${option.key} is required`,
                    );

                const valueType = typeof value;

                // ============================================================
                // selection
                // ============================================================

                if (option.type === "selection") {
                    if (typeof option.values[0] !== valueType)
                        throw new HttpErrors.BadRequest(
                            `option ${option.key}'s value must be of type ${typeof option.values[0]} not ${valueType}`,
                        );
                    if (!option.values.includes(value)) {
                        throw new HttpErrors.BadRequest(
                            `option ${option.key} value must be one of prepared values`,
                        );
                    }
                }

                // ============================================================
                // multiple
                // ============================================================

                if (option.type === "multiple") {
                    if (!Array.isArray(value)) {
                        throw new HttpErrors.BadRequest(
                            `option ${option.key} value must be an array`,
                        );
                    }

                    if (value.length === 0) {
                        if (option.required) {
                            throw new HttpErrors.BadRequest(
                                `option ${option.key} is required`,
                            );
                        }

                        newPost.options.push({
                            optionId: option._id,
                            value: null,
                        });

                        continue;
                    }

                    for (const item of value) {
                        if (typeof option.values[0] !== typeof item)
                            throw new HttpErrors.BadRequest(
                                `option ${option.key}'s value must be of type ${typeof option.values[0]} not ${typeof item}`,
                            );
                        if (!option.values.includes(item)) {
                            throw new HttpErrors.BadRequest(
                                `option ${option.key} contains an invalid value`,
                            );
                        }
                    }
                }

                // ============================================================
                // number
                // ============================================================

                if (option.type === "number") {
                    const stringValue = String(value).trim();

                    if (
                        stringValue === "" ||
                        !Number.isFinite(Number(stringValue))
                    ) {
                        throw new HttpErrors.BadRequest(
                            `option ${option.key} value must be a number`,
                        );
                    }

                    value = Number(stringValue);
                }

                // ============================================================
                // boolean
                // ============================================================

                if (option.type === "boolean") {
                    if (value === true || value === "true") {
                        value = true;
                    } else if (value === false || value === "false") {
                        value = false;
                    } else {
                        throw new HttpErrors.BadRequest(
                            `option ${option.key} value must be a boolean`,
                        );
                    }
                }

                // ============================================================
                // string
                // ============================================================

                if (option.type === "string") {
                    if (valueType !== "string") {
                        throw new HttpErrors.BadRequest(
                            `option ${option.key} value must be a string`,
                        );
                    }

                    value = value.trim();

                    if (option.required && !value) {
                        throw new HttpErrors.BadRequest(
                            `option ${option.key} is required`,
                        );
                    }

                    if (!value) value = null;
                }

                newPost.options.push({
                    optionId: option._id,
                    value,
                });
            }

            await fs.mkdir(postDirectory, { recursive: true });
            postDirectoryCreated = true;
            await moveFiles(tempDirectory, files, postDirectory);
            await this.#model.create({ _id: postId, ...newPost });
        } catch (error) {
            try {
                if (postDirectoryCreated) {
                    await removeDirectory(postDirectory);
                }
            } catch (cleanupError) {
                console.log("Failed to cleanup post files: ", cleanupError);
            }
            throw error;
        }
    };

    UpdatePostById = async (postId, userId, updatedData, uploadId) => {
        const postUpdatedData = { ...updatedData };
        const newPost = {};
        const files = [];
        const deletedFiles = [];
        let successMove = false;
        let successDelete = false;
        let addingImages = false;
        let deletingImages = false;
        const postDirectory = path.join(
            process.cwd(),
            "uploads",
            "posts",
            postId.toString(),
        );
        const deletedDirectory = path.join(
            process.cwd(),
            "uploads",
            "temp",
            uploadId.toString(),
            "deleted",
        );
        const tempDirectory = path.join(
            process.cwd(),
            "uploads",
            "temp",
            uploadId.toString(),
            "new",
        );

        try {
            // ============================================================
            // postId
            // ============================================================
            const post = await this.getPostById(postId);
            // ============================================================
            // userId
            // ============================================================
            if (userId.toString() !== post.userId.toString()) {
                throw new HttpErrors.Forbidden(
                    "only owner of the post can edit post",
                );
            }
            // ============================================================
            // title
            // ============================================================

            if (postUpdatedData.title !== undefined) {
                newPost.title = postUpdatedData.title;
            }

            // ============================================================
            // content
            // ============================================================

            if (postUpdatedData.content !== undefined) {
                newPost.content = postUpdatedData.content;
            }

            // ============================================================
            // images
            // ============================================================

            const existImages = postUpdatedData.existImages ?? [...post.images];

            if (new Set(existImages).size !== existImages.length)
                throw new HttpErrors.BadRequest("duplicate existing images");

            for (const image of existImages) {
                if (!post.images.includes(image))
                    throw new HttpErrors.BadRequest("invalid existing image");
            }

            if (
                new Set(postUpdatedData.existImages).size !== post.images.length
            ) {
                deletingImages = true;
            }

            const newImages = postUpdatedData.images ?? [];
            if (!Array.isArray(newImages))
                throw new HttpErrors.BadRequest("images must be an array");
            addingImages = newImages.length > 0;

            if (
                addingImages &&
                newImages.some(
                    (image) =>
                        !image ||
                        typeof image !== "object" ||
                        !image.filename ||
                        !image.path,
                )
            ) {
                throw new HttpErrors.BadRequest("invalid image file");
            }

            const newImagesCount = newImages?.length ?? 0;
            const total = existImages.length + newImagesCount;
            if (total < 1)
                throw new HttpErrors.BadRequest(
                    "at least one image is required",
                );
            if (total > 19)
                throw new HttpErrors.BadRequest("maximum 19 images");

            if (deletingImages) {
                post.images
                    .filter((image) => !existImages.includes(image))
                    .forEach((image) =>
                        deletedFiles.push(image.split("/").pop()),
                    );
            }
            newPost.images = [...existImages];

            if (addingImages) {
                files.push(...newImages.map((image) => image.filename));
                newPost.images.push(
                    ...newImages.map(
                        (image) => `/uploads/posts/${postId}/${image.filename}`,
                    ),
                );
            }

            // ============================================================
            // video
            // ============================================================

            if (postUpdatedData.video) {
                if (
                    !postUpdatedData.video ||
                    typeof postUpdatedData.video !== "object" ||
                    Array.isArray(postUpdatedData.video) ||
                    !postUpdatedData.video.filename ||
                    !postUpdatedData.video.path
                )
                    throw new HttpErrors.BadRequest("invalid video file");

                const newVideo = `/uploads/posts/${postId.toString()}/${postUpdatedData.video.filename}`;
                if (newVideo !== post.video) {
                    files.push(postUpdatedData.video.filename);
                    newPost.video = newVideo;
                }
            } else if (postUpdatedData.deleteVideo === true) {
                if (!post.video) {
                    throw new HttpErrors.BadRequest(
                        "video not exist to delete",
                    );
                }
                newPost.video = null;
            }
            if (post.video && "video" in newPost) {
                const fileName = post.video.split("/").pop();
                deletedFiles.push(fileName);
            }

            // ============================================================
            // location
            // ============================================================

            if (postUpdatedData.location !== undefined) {
                const { lng, lat } = postUpdatedData.location;
                newPost.location = {
                    type: "Point",
                    coordinates: [lng, lat],
                };
            }

            // ============================================================
            // city
            // ============================================================

            // If location is being changed, city must also be sent.
            // This allows us to make sure the post does not move to
            // another city.
            if (postUpdatedData.location !== undefined) {
                if (postUpdatedData.city !== undefined) {
                    if (!postUpdatedData.city)
                        throw new HttpErrors.BadRequest("city required");

                    // City of an existing post cannot be changed.
                    if (post.city !== postUpdatedData.city)
                        throw new HttpErrors.BadRequest(
                            "city of post cannot be changed",
                        );

                    newPost.city = postUpdatedData.city;
                } else {
                    throw new HttpErrors.BadRequest(
                        "city required when location is updated",
                    );
                }
            } else if (postUpdatedData.city !== undefined)
                throw new HttpErrors.BadRequest(
                    "can not update city without location",
                );

            // ============================================================
            // neighbourhood
            // ============================================================
            if (postUpdatedData.location !== undefined) {
                if (postUpdatedData.neighbourhood !== undefined) {
                    if (
                        postUpdatedData.neighbourhood === null ||
                        (typeof postUpdatedData.neighbourhood === "string" &&
                            postUpdatedData.neighbourhood.trim() === "")
                    ) {
                        //clear neighbourhood
                        newPost.neighbourhood = null;
                    } else {
                        const neighbourhood =
                            postUpdatedData.neighbourhood.trim();

                        newPost.neighbourhood = neighbourhood
                            ? neighbourhood
                            : null;
                    }
                } else {
                    newPost.neighbourhood = null;
                }
            } else if (postUpdatedData.neighbourhood !== undefined)
                throw new HttpErrors.BadRequest(
                    "can not update neighbourhood without location",
                );

            // ============================================================
            // address
            // ============================================================

            if (postUpdatedData.location !== undefined) {
                if (postUpdatedData.address !== undefined) {
                    if (!postUpdatedData.address)
                        throw new HttpErrors.BadRequest("address required");

                    newPost.address = postUpdatedData.address;
                } else {
                    throw new HttpErrors.BadRequest(
                        "address is required when location is provided",
                    );
                }
            } else if (postUpdatedData.address !== undefined)
                throw new HttpErrors.BadRequest(
                    "can not update address without location",
                );

            // ============================================================
            // options
            // ============================================================
            const options = await this.#optionService.getOptionsByCategoryId(
                post.categoryId,
            );
            const postOptions = post.options ?? [];

            // optionId -> post option
            const postOptionMap = new Map(
                postOptions.map((postOption) => [
                    postOption.optionId.toString(),
                    postOption,
                ]),
            );

            if (postOptions.length !== postOptionMap.size) {
                throw new HttpErrors.InternalServerError(
                    "post contains duplicate options",
                );
            }

            const optionsChanged =
                postUpdatedData.options !== undefined ||
                options.length !== postOptions.length ||
                options.some(({ _id }) => !postOptionMap.has(_id.toString()));

            if (optionsChanged) {
                if (
                    postUpdatedData.options === undefined ||
                    Object.keys(postUpdatedData.options).length === 0
                ) {
                    throw new HttpErrors.BadRequest("options are required");
                }

                if (options.length === 0)
                    throw new HttpErrors.BadRequest(
                        "this category has no options",
                    );

                const validOptionKeys = new Set(
                    options.map((option) => option.key),
                );

                for (const key of Object.keys(postUpdatedData.options)) {
                    if (!validOptionKeys.has(key)) {
                        throw new HttpErrors.BadRequest(
                            `invalid option ${key}`,
                        );
                    }
                }

                newPost.options = [];

                for (const option of options) {
                    const postOption = postOptionMap.get(option._id.toString());

                    const hasOption = Object.prototype.hasOwnProperty.call(
                        postUpdatedData.options,
                        option.key,
                    );

                    let value;

                    // --------------------------------------------------------
                    // Option explicitly sent in request
                    // --------------------------------------------------------

                    if (hasOption) {
                        value = postUpdatedData.options[option.key];

                        // required
                        if (
                            option.required &&
                            (value === undefined || value === null)
                        ) {
                            throw new HttpErrors.BadRequest(
                                `option ${option.key} is required`,
                            );
                        }
                        // null for optional option
                        if (value === undefined || value === null) {
                            newPost.options.push({
                                optionId: option._id,
                                value: null,
                            });
                            continue;
                        }

                        const valueType = typeof value;

                        // ============================================================
                        // selection
                        // ============================================================

                        if (option.type === "selection") {
                            if (typeof option.values[0] !== valueType) {
                                throw new HttpErrors.BadRequest(
                                    `option ${option.key}'s value must be of type ${typeof option.values[0]} not ${valueType}`,
                                );
                            }
                            if (!option.values.includes(value)) {
                                throw new HttpErrors.BadRequest(
                                    `option ${option.key} value must be one of prepared values`,
                                );
                            }
                        }

                        // ============================================================
                        // multiple
                        // ============================================================

                        if (option.type === "multiple") {
                            if (!Array.isArray(value)) {
                                throw new HttpErrors.BadRequest(
                                    `option ${option.key} value must be an array`,
                                );
                            }

                            if (value.length === 0) {
                                if (option.required) {
                                    throw new HttpErrors.BadRequest(
                                        `option ${option.key} is required`,
                                    );
                                }

                                value = null;
                            } else {
                                for (const item of value) {
                                    if (
                                        typeof option.values[0] !== typeof item
                                    ) {
                                        throw new HttpErrors.BadRequest(
                                            `option ${option.key}'s value must be of type ${typeof option.values[0]} not ${typeof item}`,
                                        );
                                    }
                                    if (!option.values.includes(item)) {
                                        throw new HttpErrors.BadRequest(
                                            `option ${option.key} contains an invalid value`,
                                        );
                                    }
                                }
                            }
                        }

                        // ============================================================
                        // number
                        // ============================================================

                        if (option.type === "number") {
                            const stringValue = String(value).trim();

                            if (
                                stringValue === "" ||
                                !Number.isFinite(Number(stringValue))
                            ) {
                                throw new HttpErrors.BadRequest(
                                    `option ${option.key} value must be a number`,
                                );
                            }

                            value = Number(stringValue);
                        }

                        // ============================================================
                        // boolean
                        // ============================================================

                        if (option.type === "boolean") {
                            if (value === true || value === "true") {
                                value = true;
                            } else if (value === false || value === "false") {
                                value = false;
                            } else {
                                throw new HttpErrors.BadRequest(
                                    `option ${option.key} value must be a boolean`,
                                );
                            }
                        }

                        // ============================================================
                        // string
                        // ============================================================

                        if (option.type === "string") {
                            if (valueType !== "string") {
                                throw new HttpErrors.BadRequest(
                                    `option ${option.key} value must be a string`,
                                );
                            }

                            value = value.trim();

                            if (option.required && !value) {
                                throw new HttpErrors.BadRequest(
                                    `option ${option.key} is required`,
                                );
                            }

                            if (!value) value = null;
                        }
                    }

                    // --------------------------------------------------------
                    // Option was not sent in request
                    // --------------------------------------------------------
                    else {
                        // Option already existed in post
                        if (postOption) {
                            value = postOption.value;

                            // A required option must have a value
                            // when the post is edited.
                            if (
                                option.required &&
                                (value === undefined ||
                                    value === null ||
                                    value === "")
                            ) {
                                throw new HttpErrors.BadRequest(
                                    `option ${option.key} is required`,
                                );
                            }
                        } else {
                            // New option added to category
                            if (option.required) {
                                throw new HttpErrors.BadRequest(
                                    `option ${option.key} is required`,
                                );
                            }

                            value = null;
                        }
                    }

                    newPost.options.push({
                        optionId: option._id,
                        value,
                    });
                }
            }

            // ============================================================
            // update
            // ============================================================
            if (files.length > 0) {
                await moveFiles(tempDirectory, files, postDirectory);
                successMove = true;
            }
            if (deletedFiles.length > 0) {
                await fs.mkdir(deletedDirectory, { recursive: true });
                await moveFiles(postDirectory, deletedFiles, deletedDirectory);
                successDelete = true;
            }
            const updatedPost = await this.#model.findByIdAndUpdate(
                postId,
                newPost,
                {
                    new: true,
                    runValidators: true,
                },
            );

            if (!updatedPost) {
                throw new HttpErrors.NotFound("Post not found");
            }
        } catch (error) {
            try {
                // Move files back from deleted directory to post directory
                if (successDelete) {
                    await moveFiles(
                        deletedDirectory,
                        deletedFiles,
                        postDirectory,
                    );
                }
            } catch (rollbackError) {
                console.log(
                    "rollback error on move files back from deleted directory:",
                    rollbackError,
                );
            }
            try {
                // Move files back from post directory to temp directory
                if (successMove) {
                    await moveFiles(postDirectory, files, tempDirectory);
                }
            } catch (rollbackError) {
                console.log(
                    "rollback error on move files back from post directory:",
                    rollbackError,
                );
            }

            throw error;
        }
    };
    deletePostById = async (postId, userId) => {
        const postDirectory = path.join(
            process.cwd(),
            "uploads",
            "posts",
            postId.toString(),
        );
        // ============================================================
        // postId
        // ============================================================
        const post = await this.getPostById(postId);
        // ============================================================
        // userId
        // ============================================================
        if (!userId) {
            throw new HttpErrors.BadRequest("user id is required");
        }
        if (post.userId.toString() !== userId.toString()) {
            throw new HttpErrors.Forbidden(
                "You are not authorized to delete this post",
            );
        }
        const result = await this.#model.findByIdAndDelete(postId);
        if (result) {
            // Delete the post directory if it exists
            try {
                await fs.rm(postDirectory, { recursive: true });
            } catch (error) {
                console.error(
                    "Error occurred while deleting post directory:",
                    error,
                );
            }
        }
    };
}
module.exports = new PostService();
