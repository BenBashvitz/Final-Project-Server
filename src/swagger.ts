import swaggerJsdoc from "swagger-jsdoc";
import dotenv from "dotenv";

dotenv.config({ path: ".env.dev" });

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Second Assignment API",
      version: "1.0.0",
      description:
        "A REST API for managing posts and comments with user authentication",
    },
    servers: [
      {
        url: "http://localhost:" + process.env.PORT,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          required: ["email", "username", "password"],
          properties: {
            _id: {
              type: "string",
              description: "User ID",
              example: "697cc87180aa7bb6865a259d",
            },
            email: {
              type: "string",
              description: "User email address",
              example: "user@example.com",
            },
            username: {
              type: "string",
              description: "Username",
              example: "exampleUser",
            },
            password: {
              type: "string",
              description: "User password",
              example: "password123",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            token: {
              type: "string",
              description: "JWT access token",
            },
            refreshToken: {
              type: "string",
              description: "JWT refresh token",
            },
          },
        },
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
