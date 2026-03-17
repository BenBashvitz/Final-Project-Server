import swaggerJsdoc from "swagger-jsdoc";
import dotenv from "dotenv";
import config from './config';

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
        url: `${config.SERVER_URL}:${config.PORT}`,
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
          description: "An error message",
          example: "An error occurred",
        },
        ZodTreeError: {
          type: "object",
          required: ["errors"],
          description:
              "Validation error object returned by z.treeifyError, with nested property errors.",
          properties: {
            errors: {
              type: "array",
              description: "Validation errors for the current object level.",
              items: {
                type: "string",
              },
              example: [],
            },
            properties: {
              type: "object",
              description: "Nested validation errors keyed by property name.",
              additionalProperties: {
                $ref: "#/components/schemas/ZodTreeError",
              },
            },
            items: {
              type: "array",
              description:
                  "Nested validation errors for array items when the validated value is an array.",
              items: {
                $ref: "#/components/schemas/ZodTreeError",
              },
            },
          },
          example: {
            errors: [],
            properties: {
              cursor: {
                errors: [],
                properties: {
                  _id: {
                    errors: [
                      "Invalid input: expected string, received undefined",
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
