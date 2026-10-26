const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");

const swaggerConfig = (app) => {
    const swaggerDocument = swaggerJSDoc({
        definition: {
            openapi: "3.0.3",
            info: {
                title: "Divar",
                description: "api for an exercise project",
                version: "1.0.0",
            },
            components: {
                securitySchemes: {
                    cookieAuth: {
                        type: "apiKey",
                        in: "cookie",
                        name: "access_token",
                    },
                    bearerAuth: { type: "http", scheme: "bearer" },
                },
            },
        },
        apis: [process.cwd() + "/src/module/**/*.swagger.js"],
    });

    app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));
};

module.exports = swaggerConfig;
