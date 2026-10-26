const httpCode = require("http-status-codes");
const path = require("path");

const postService = require("./post.service");
const { removeDirectory } = require("../../common/utils/files.utils");

class PostController {
    #service;

    constructor() {
        this.#service = postService;
    }

    createPost = async (req, res, next) => {
        const uploadId = req.uploadId;
        const tempDirectory = path.join(
            process.cwd(),
            "uploads",
            "temp",
            uploadId.toString(),
        );
        try {
            const { userId } = req.user;
            const {
                title,
                content,
                category: categorySlug,
                location,
                city,
                neighbourhood,
                address,
                options,
            } = req.body;
            const images = req.files?.images || [];
            const video = req.files?.video?.at(0) || null;

            await this.#service.createPost(
                userId,
                {
                    title,
                    content,
                    images,
                    video,
                    categorySlug,
                    location,
                    city,
                    neighbourhood,
                    address,
                    options,
                },
                uploadId,
            );

            res.status(httpCode.StatusCodes.CREATED).send(
                "post created successfully",
            );
        } catch (error) {
            next(error);
        } finally {
            try {
                await removeDirectory(tempDirectory);
            } catch (cleanupError) {
                console.error("Failed to cleanup temp directory", cleanupError);
            }
        }
    };
    updatePostById = async (req, res, next) => {
        const uploadId = req.uploadId;
        const tempDirectory = path.join(
            process.cwd(),
            "uploads",
            "temp",
            uploadId.toString(),
        );
        try {
            const { userId } = req.user;
            const { postId } = req.params;
            const {
                title,
                content,
                existImages,
                deleteVideo,
                location,
                city,
                neighbourhood,
                address,
                options,
            } = req.body;

            const images = req.files?.images || undefined;
            const video = req.files?.video?.at(0);

            await this.#service.UpdatePostById(
                postId,
                userId,
                {
                    title,
                    content,
                    existImages,
                    images,
                    deleteVideo,
                    video,
                    location,
                    city,
                    neighbourhood,
                    address,
                    options,
                },
                uploadId,
            );
            res.status(httpCode.StatusCodes.OK).send(
                "post updated successfully",
            );
        } catch (error) {
            next(error);
        } finally {
            try {
                await removeDirectory(tempDirectory);
            } catch (cleanupError) {
                console.error("Failed to cleanup temp directory", cleanupError);
            }
        }
    };
    getPostById = async (req, res, next) => {
        try {
            const { postId } = req.params;
            const post = await this.#service.getPostById(postId);
            res.status(httpCode.StatusCodes.OK).json(post);
        } catch (error) {
            next(error);
        }
    };

    getPosts = async (request, response, next) => {
        try {
            const {
                categorySlug,
                city,
                neighbourhood,
                hasVideo,
                publishedAfter,
                page,
                limit,
                sort,
                ...optionFilters
            } = request.validatedQuery;

            const result = await this.#service.getPosts({
                categorySlug,

                filters: {
                    city,
                    neighbourhood,
                    hasVideo,
                    publishedAfter,
                },

                optionFilters,

                pagination: {
                    page,
                    limit,
                    sort,
                },
            });

            return response.status(200).json({
                status: "success",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    deletePostById = async (req, res, next) => {
        try {
            const { postId } = req.params;
            const { userId } = req.user;
            await this.#service.deletePostById(postId, userId);
            res.status(httpCode.StatusCodes.OK).send(
                "post deleted successfully",
            );
        } catch (error) {
            next(error);
        }
    };
}

module.exports = new PostController();
