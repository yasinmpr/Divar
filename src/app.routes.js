const router = require("express").Router();

const authRouter = require("./module/auth/auth.routes");
const userRouter = require("./module/user/user.routes");
const categoryRouter = require("./module/category/category.routes");
const optionRouter = require("./module/option/option.routes");
const postRouter = require("./module/post/post.routes");
const { verifyLogin } = require("./common/jwt/jwt.middleware");

router.use("/api/auth", authRouter);
router.use("/api/user", verifyLogin, userRouter);
router.use("/api/categories", categoryRouter);
router.use("/api/options", optionRouter);
router.use("/api/posts", postRouter);

module.exports = router;
