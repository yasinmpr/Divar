const router = require("express").Router();

const userController = require("./user.controller");

router.get("/profile", userController.profile);

module.exports = router;
