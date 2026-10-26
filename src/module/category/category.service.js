const { isObjectIdOrHexString } = require("mongoose");
const HttpErrors = require("http-errors");
const slugify = require("slugify");
const fs = require("fs/promises");
const path = require("path");
const objectId = require("mongoose").Types.ObjectId;

const categoryModel = require("./category.model");
const postModel = require("../post/post.model");
const optionModel = require("../option/option.model");
const { buildCategoryTree } = require("./category.utils");
const {
    moveFiles,
    removeDirectory,
} = require("../../common/utils/files.utils");

class CategoryService {
    #model;
    #postModel;
    #optionModel;
    constructor() {
        this.#model = categoryModel;
        this.#postModel = postModel;
        this.#optionModel = optionModel;
    }

    getAllCategories = async () => {
        const categories = await this.#model.find({}).lean();
        const categoryTree = buildCategoryTree(categories);
        return categoryTree;
    };

    getCategoryById = async (categoryId) => {
        return await this.checkExistById(categoryId);
    };

    createCategory = async (newCategory, uploadId) => {
        const categoryData = { ...newCategory };
        const finalData = {};
        const categoryId = new objectId().toString().toLowerCase();
        const tempDirectory = path.join(
            process.cwd(),
            "uploads",
            "temp",
            uploadId.toString(),
        );
        const categoryDirectory = path.join(
            process.cwd(),
            "uploads",
            "category",
            categoryId,
        );
        let createdPostDirectory = false;

        try {
            // check title
            if (!categoryData.title) {
                throw new HttpErrors.BadRequest("category title is invalid");
            }
            await this.#checkNotExistByTitle(categoryData.title);
            finalData.title = categoryData.title;

            //check slug
            categoryData.slug = slugify(categoryData.slug, {
                lower: true,
                strict: true,
                trim: true,
            });
            if (!categoryData.slug)
                throw new HttpErrors.BadRequest("category slug is invalid");
            await this.#checkNotExistBySlug(categoryData.slug);
            finalData.slug = categoryData.slug;

            // check parent id
            if (
                categoryData.parentId &&
                !!(await this.checkExistById(categoryData.parentId))
            ) {
                if (
                    await this.#optionModel.exists({
                        categoryId: categoryData.parentId,
                    })
                ) {
                    throw new HttpErrors.Conflict(
                        "parent category is used in some options, cannot be set as parent",
                    );
                }

                if (
                    await this.#postModel.exists({
                        categoryId: categoryData.parentId,
                    })
                ) {
                    throw new HttpErrors.Conflict(
                        "parent category is used in some posts, cannot be set as parent",
                    );
                }
            }
            finalData.parentId = categoryData.parentId;

            // check icon
            const isRoot = categoryData.parentId === null;
            const hasIcon = categoryData.icon !== undefined;

            if (hasIcon && !isRoot) {
                throw new HttpErrors.BadRequest(
                    "only root category can have icon",
                );
            }
            if (isRoot && !hasIcon) {
                throw new HttpErrors.BadRequest("category icon is required");
            }

            if (isRoot) {
                if (
                    !finalData.parentId &&
                    (typeof categoryData.icon !== "object" ||
                        !categoryData.icon.filename ||
                        !categoryData.icon.path)
                ) {
                    throw new HttpErrors.BadRequest(
                        "invalid image file for category icon",
                    );
                }
                const file = categoryData.icon.filename;
                finalData.icon = `/uploads/category/${categoryId.toString()}/${file}`;

                if (file) {
                    await fs.mkdir(categoryDirectory, { recursive: true });
                    createdPostDirectory = true;
                    await moveFiles(tempDirectory, [file], categoryDirectory);
                }
            }

            const newCategory = await this.#model.create({
                _id: categoryId,
                ...finalData,
            });
            return `category ${newCategory.title}/${newCategory.slug} created successfully`;
        } catch (error) {
            try {
                if (createdPostDirectory) {
                    await removeDirectory(categoryDirectory);
                }
            } catch (cleanupError) {
                console.error(
                    "Failed to cleanup category files: ",
                    cleanupError,
                );
            }
            throw error;
        }
    };
    deleteCategory = async (categoryId) => {
        const categoryDirectory = path.join(
            process.cwd(),
            "uploads",
            "category",
            categoryId.toString(),
        );

        await this.checkExistById(categoryId);

        if (await this.#model.exists({ parentId: categoryId })) {
            throw new HttpErrors.Conflict(
                "category has descendants, cannot be deleted",
            );
        }

        if (await this.#postModel.exists({ categoryId })) {
            throw new HttpErrors.Conflict(
                "category is used in some posts, cannot be deleted",
            );
        }

        if (await this.#optionModel.exists({ categoryId })) {
            throw new HttpErrors.Conflict(
                "category is used in some options, cannot be deleted",
            );
        }

        const result = await this.#model.deleteOne({ _id: categoryId });
        if (!result.deletedCount) {
            throw new HttpErrors.BadRequest("category did not deleted");
        }

        await removeDirectory(categoryDirectory);
    };

    updateCategory = async (categoryId, categoryUpdateData, uploadId) => {
        const categoryData = { ...categoryUpdateData };
        const finalData = {};

        const tempDirectory = path.join(
            process.cwd(),
            "uploads",
            "temp",
            uploadId.toString(),
        );

        const categoryDirectory = path.join(
            process.cwd(),
            "uploads",
            "category",
            categoryId.toString(),
        );

        let file = null;
        let deleteFile = null;
        let successMoved = false;
        let successDeleted = false;

        try {
            const category = await this.checkExistById(categoryId);

            // check title
            if (categoryData.title !== undefined) {
                if (!categoryData.title) {
                    throw new HttpErrors.BadRequest(
                        "category title is invalid",
                    );
                }
                if (categoryData.title === category.title) {
                    throw new HttpErrors.Conflict(
                        "category title is the same as the current title, please provide a different title",
                    );
                }
                await this.#checkNotExistByTitle(categoryData.title);
                finalData.title = categoryData.title;
            }

            //check slug
            if (categoryData.slug !== undefined) {
                categoryData.slug = slugify(categoryData.slug, {
                    lower: true,
                    strict: true,
                    trim: true,
                });
                if (!categoryData.slug) {
                    throw new HttpErrors.BadRequest("category slug is invalid");
                }
                if (categoryData.slug === category.slug) {
                    throw new HttpErrors.Conflict(
                        "category slug is the same as the current slug, please provide a different slug",
                    );
                }
                await this.#checkNotExistBySlug(categoryData.slug);
                finalData.slug = categoryData.slug;
            }

            // check parent id
            if (categoryData.parentId !== undefined) {
                if (categoryData.parentId !== null) {
                    await this.checkExistById(categoryData.parentId);

                    if (
                        await this.#optionModel.exists({
                            categoryId: categoryData.parentId,
                        })
                    ) {
                        throw new HttpErrors.Conflict(
                            "parent category is used in some options, cannot be set as parent",
                        );
                    }

                    if (
                        await this.#postModel.exists({
                            categoryId: categoryData.parentId,
                        })
                    ) {
                        throw new HttpErrors.Conflict(
                            "parent category is used in some posts, cannot be set as parent",
                        );
                    }

                    if (categoryData.parentId === categoryId) {
                        throw new HttpErrors.BadRequest(
                            "can not set a category as parent of itself",
                        );
                    }

                    if (
                        await this.#isDescendant(
                            categoryId,
                            categoryData.parentId,
                        )
                    ) {
                        throw new HttpErrors.BadRequest(
                            "cannot set a descendant category as parent",
                        );
                    }
                }

                finalData.parentId = categoryData.parentId;
            } else {
                // parentId was not changed
                categoryData.parentId = category.parentId;
            }

            // -------------------------
            // check icon
            // -------------------------

            const deleteIcon = categoryData.deleteIcon;

            const hasNewIcon = categoryData.icon !== undefined;

            const isRoot = categoryData.parentId === null;
            const isBecomingChild =
                category.parentId === null && categoryData.parentId !== null;
            const isBecomingRoot =
                category.parentId !== null && categoryData.parentId === null;

            if (isBecomingChild) {
                if (!deleteIcon || hasNewIcon) {
                    throw new HttpErrors.BadRequest(
                        "only root category can have icon",
                    );
                }
            }
            if (isBecomingRoot) {
                if (!hasNewIcon) {
                    throw new HttpErrors.BadRequest(
                        "category icon is required",
                    );
                }
            }
            // new icon
            if (hasNewIcon) {
                if (
                    typeof categoryData.icon !== "object" ||
                    !categoryData.icon.filename ||
                    !categoryData.icon.path
                ) {
                    throw new HttpErrors.BadRequest(
                        "invalid image file for category icon",
                    );
                }
                // only root category can have icon
                if (!isRoot) {
                    throw new HttpErrors.BadRequest(
                        "only root category can have icon",
                    );
                }
                file = categoryData.icon.filename;
                finalData.icon = `/uploads/category/${categoryId.toString()}/${categoryData.icon.filename}`;
                if (category.icon !== null) {
                    deleteFile = category.icon.split("/").pop();
                }
            }
            // -------------------------
            // delete icon
            // -------------------------
            else if (deleteIcon) {
                if (category.icon === null) {
                    throw new HttpErrors.BadRequest(
                        "category does not have an icon",
                    );
                }
                if (isRoot) {
                    throw new HttpErrors.BadRequest(
                        "category icon is required",
                    );
                }
                deleteFile = category.icon.split("/").pop();
                finalData.icon = null;
            }

            // -------------------------
            // check before update
            // -------------------------

            if ("slug" in finalData || "parentId" in finalData) {
                if (await this.#optionModel.exists({ categoryId })) {
                    throw new HttpErrors.Conflict(
                        "category is used in some options, cannot be updated",
                    );
                }

                if (await this.#postModel.exists({ categoryId })) {
                    throw new HttpErrors.Conflict(
                        "category is used in some posts, cannot be updated",
                    );
                }
            }

            // -------------------------
            // Update category data
            // -------------------------

            if (file) {
                if (!deleteFile) {
                    await fs.mkdir(categoryDirectory, { recursive: true });
                }
                await moveFiles(tempDirectory, [file], categoryDirectory);
                successMoved = true;
            }
            if (deleteFile) {
                await moveFiles(categoryDirectory, [deleteFile], tempDirectory);
                successDeleted = true;
            }

            const updatedCategory = await this.#model.findByIdAndUpdate(
                categoryId,
                finalData,
                { new: true },
            );
            if (deleteFile && !file) {
                await removeDirectory(categoryDirectory);
            }
            return updatedCategory;
        } catch (error) {
            try {
                if (file && successMoved) {
                    await moveFiles(categoryDirectory, [file], tempDirectory);
                }
            } catch (rollbackError) {
                console.log("Failed to rollback deleted icon:", rollbackError);
            }
            try {
                if (deleteFile && successDeleted) {
                    await moveFiles(
                        tempDirectory,
                        [deleteFile],
                        categoryDirectory,
                    );
                }
            } catch (rollbackError) {
                console.log("Failed to rollback new icon:", rollbackError);
            }
            throw error;
        }
    };

    #isDescendant = async (categoryId, newParentId) => {
        let currentId = newParentId;

        while (currentId) {
            const category = await this.#model
                .findById(currentId, { parentId: 1 })
                .lean();

            if (!category) break;

            if (category.parentId?.toString() === categoryId.toString()) {
                return true;
            }

            currentId = category.parentId;
        }

        return false;
    };

    getDescendantIds = async (categoryId) => {
        const categories = await this.#model
            .find()
            .select("_id parentId")
            .lean();

        const childrenMap = new Map();

        for (const category of categories) {
            const parentId = category.parentId?.toString();

            if (!parentId) continue;

            if (!childrenMap.has(parentId)) {
                childrenMap.set(parentId, []);
            }

            childrenMap.get(parentId).push(category);
        }

        const leafIds = [];
        const visited = new Set();
        const stack = [categoryId.toString()];
        while (stack.length) {
            const id = stack.pop();
            if (visited.has(id)) continue;
            visited.add(id);
            const children = childrenMap.get(id) || [];
            if (children.length === 0) leafIds.push(id);
            else stack.push(...children.map((child) => child._id.toString()));
        }
        return leafIds;
    };

    #checkNotExistBySlug = async (slug) => {
        const category = await this.#model.findOne({ slug }).lean();
        if (category) {
            throw new HttpErrors.Conflict(
                "A category with this slug already exists",
            );
        }
        return !!category;
    };

    checkExistById = async (categoryId) => {
        const category = await this.#model.findById(categoryId).lean();

        if (!category) {
            throw new HttpErrors.NotFound("category not found");
        }
        return category;
    };

    getIdFromSlug = async (slug) => {
        const category = await this.#model.findOne({ slug }, { _id: 1 }).lean();

        if (!category || !isObjectIdOrHexString(category._id)) {
            throw new HttpErrors.NotFound("category not found");
        }

        return category._id;
    };

    #checkNotExistByTitle = async (title) => {
        const category = await this.#model.findOne({ title }).lean();
        if (category) {
            throw new HttpErrors.Conflict(
                "A category with this title already exists",
            );
        }
    };

    isLeaf = async (categoryId) => {
        const hasChild = await this.#model.exists({
            parentId: categoryId,
        });

        return !hasChild;
    };
}
module.exports = new CategoryService();
