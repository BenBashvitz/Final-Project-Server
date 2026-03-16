import swaggerJsdoc from "swagger-jsdoc";
import dotenv from "dotenv";
import env from './env';

dotenv.config({ path: ".env.dev" });

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Final Project API",
      version: "1.0.0",
      description:
        "A REST API for managing posts and comments with user authentication",
    },
    servers: [
      {
        url: `${env.SERVER_URL}:${env.PORT}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        accessToken: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
        },
        refreshToken: {
          type: "apiKey",
          in: "cookie",
          name: "refreshToken",
        },
      },
      schemas: {
        Error: {
          type: "string",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
