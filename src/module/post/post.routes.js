const router = require("express").Router();
const { verifyLogin } = require("../../common/jwt/jwt.middleware");
const createUploadID = require("../../common/middleware/createUploadID.middleware");
const handleUpload = require("../../common/middleware/upload.middleware");
const upload = require("../../common/middleware/postUploadMulter.middleware");
const validate = require("../../common/middleware/validation.middleware");
const {
    getPostsValidation,
    getPostByIdValidation,
    createPostValidation,
    updatePostParamsValidation,
    updatePostBodyValidation,
    deletePostValidation,
} = require("./post.validation");
const {
    uploadLimiter,
    adMutationLimiter,
} = require("../../common/middleware/rateLimit");
const postController = require("./post.controller");

router.get(
    "/:postId",
    validate(getPostByIdValidation, "params"),
    postController.getPostById,
);
router.get("/", validate(getPostsValidation, "query"), postController.getPosts);
router.post(
    "/",
    verifyLogin,
    adMutationLimiter,
    createUploadID,
    handleUpload(
        upload.fields([
            { name: "images", maxCount: 19 },
            { name: "video", maxCount: 1 },
        ]),
    ),
    validate(createPostValidation),
    postController.createPost,
);
router.patch(
    "/:postId",
    verifyLogin,
    adMutationLimiter,
    createUploadID,
    handleUpload(
        upload.fields([
            { name: "images", maxCount: 19 },
            { name: "video", maxCount: 1 },
        ]),
    ),
    validate(updatePostParamsValidation, "params"),
    validate(updatePostBodyValidation),
    postController.updatePostById,
);
router.delete(
    "/:postId",
    verifyLogin,
    validate(deletePostValidation, "params"),
    postController.deletePostById,
);

module.exports = router;
