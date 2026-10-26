const path = require("node:path");
const categoryservice = require("./category.service");
const HttpStatusCode = require("http-status-codes");
const { removeDirectory } = require("../../common/utils/files.utils");
const { serializeCategory } = require("./category.utils");
class CategoryController {
    #service;

    constructor() {
        this.#service = categoryservice;
    }

    getAllCategories = async (req, res, next) => {
        try {
            const isAdmin = req.user?.role === "admin";
            const categories = await this.#service.getAllCategories();

            const result = categories.map((category) =>
                serializeCategory(category, isAdmin),
            );

            res.status(HttpStatusCode.StatusCodes.OK).json({
                categories: result,
            });
        } catch (error) {
            next(error);
        }
    };

    getCategoryById = async (req, res, next) => {
        try {
            const { categoryId } = req.params;

            const category = await this.#service.getCategoryById(categoryId);
            res.status(HttpStatusCode.StatusCodes.OK).json(category);
        } catch (error) {
            next(error);
        }
    };

    createCategory = async (req, res, next) => {
        const uploadId = req.uploadId;
        const tempDirectory = path.join(
            process.cwd(),
            "uploads",
            "temp",
            uploadId.toString(),
        );
        try {
            const { title, slug, parentId } = req.body;
            const icon = req.file || undefined;

            const result = await this.#service.createCategory(
                {
                    title,
                    slug,
                    parentId,
                    icon,
                },
                uploadId,
            );
            res.status(HttpStatusCode.StatusCodes.CREATED).json(result);
        } catch (error) {
            next(error);
        } finally {
            // Delete the temporary directory after processing
            try {
                await removeDirectory(tempDirectory);
            } catch (cleanupError) {
                console.error("Failed to cleanup temp files:", cleanupError);
            }
        }
    };

    updateCategory = async (req, res, next) => {
        const uploadId = req.uploadId;
        const tempDirectory = path.join(
            process.cwd(),
            "uploads",
            "temp",
            uploadId.toString(),
        );
        try {
            const { categoryId } = req.params;
            const { title, slug, parentId, deleteIcon } = req.body;
            const icon = req.file || undefined;

            const result = await this.#service.updateCategory(
                categoryId,
                {
                    title,
                    slug,
                    parentId,
                    icon,
                    deleteIcon,
                },
                uploadId,
            );
            res.status(HttpStatusCode.StatusCodes.OK).json(result);
        } catch (error) {
            next(error);
        } finally {
            // Delete the temporary directory after processing
            try {
                await removeDirectory(tempDirectory);
            } catch (cleanupError) {
                console.error("Failed to cleanup temp files:", cleanupError);
            }
        }
    };
    deleteCategory = async (req, res, next) => {
        try {
            const { categoryId } = req.params;
            await this.#service.deleteCategory(categoryId);
            res.status(HttpStatusCode.StatusCodes.OK).json({
                message: "category deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    };
}

module.exports = new CategoryController();
