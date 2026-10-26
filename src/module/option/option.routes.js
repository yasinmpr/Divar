const router = require("express").Router();
const { verifyLogin, verifyAdmin } = require("../../common/jwt/jwt.middleware");
const validate = require("../../common/middleware/validation.middleware");
const {
    getOptionByIdValidation,
    getOptionsByCategoryIdValidation,
    getOptionsByCategorySlugValidation,
    createOptionValidation,
    updateOptionParamsValidation,
    updateOptionBodyValidation,
    deleteOptionValidation,
} = require("./option.validation");
const optionController = require("./option.controller");

router.get(
    "/category/:categorySlug",
    validate(getOptionsByCategorySlugValidation, "params"),
    optionController.getOptionsByCategorySlug,
);
router.use(verifyLogin, verifyAdmin);
router.get(
    "/category/by-id/:categoryId",
    validate(getOptionsByCategoryIdValidation, "params"),
    optionController.getOptionsByCategoryId,
);
router.get(
    "/:optionId",
    validate(getOptionByIdValidation, "params"),
    optionController.getOptionById,
);
router.post(
    "/",
    validate(createOptionValidation),
    optionController.createOption,
);
router.patch(
    "/:optionId",
    validate(updateOptionParamsValidation, "params"),
    validate(updateOptionBodyValidation),
    optionController.updateOptionById,
);
router.delete(
    "/:optionId",
    validate(deleteOptionValidation, "params"),
    optionController.deleteOptionById,
);

module.exports = router;
