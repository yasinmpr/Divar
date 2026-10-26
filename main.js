require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const helmet = require("helmet");

const connect_to_mongoose = require("./src/config/mongoos.config");
const swaggerConfig = require("./src/config/swagger.config");
const notFoundError = require("./src/common/exeption/notFoundError.middleware");
const allExeptionHandler = require("./src/common/exeption/errorHandler.middleware");
const router = require("./src/app.routes");
const { globalLimiter } = require("./src/common/middleware/rateLimit");

const main = async () => {
    try {
        await connect_to_mongoose();
        const app = express();
        app.use(helmet());
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(cookieParser());
        app.use(
            "/uploads",
            express.static(path.join(process.cwd(), "uploads")),
        );
        if (process.env.NODE_ENV === "development") swaggerConfig(app);

        app.use(globalLimiter);
        app.use(router);
        app.use(notFoundError);
        app.use(allExeptionHandler);

        app.listen(process.env.PORT);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

main();
