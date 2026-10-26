const router = require("express").Router();
const {
    verifyLogin,
    verifyAdmin,
    optionalAuth,
} = require("../../common/jwt/jwt.middleware");
const createUploadId = require("../../common/middleware/createUploadID.middleware");
const upload = require("../../common/middleware/categoryUploadMulter.miaddleware");
const handleUpload = require("../../common/middleware/upload.middleware");
const validate = require("../../common/middleware/validation.middleware");
const {
    getCategoryByIdValidation,
    createCategoryValidation,
    updateCategoryParamsValidation,
    updateCategoryBodyValidation,
    deleteCategoryValidation,
} = require("./category.validation");
const categoryController = require("./category.controller");

router.get("/", optionalAuth, categoryController.getAllCategories);
router.use(verifyLogin, verifyAdmin);
router.get(
    "/:categoryId",
    validate(getCategoryByIdValidation, "params"),
    categoryController.getCategoryById,
);
router.post(
    "/",
    createUploadId,
    handleUpload(upload.single("icon")),
    validate(createCategoryValidation),
    categoryController.createCategory,
);
router.patch(
    "/:categoryId",
    createUploadId,
    handleUpload(upload.single("icon")),
    validate(updateCategoryParamsValidation, "params"),
    validate(updateCategoryBodyValidation),
    categoryController.updateCategory,
);
router.delete(
    "/:categoryId",
    validate(deleteCategoryValidation, "params"),
    categoryController.deleteCategory,
);

module.exports = router;
