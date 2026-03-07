import swaggerJsdoc from "swagger-jsdoc";
import dotenv from "dotenv";

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
        Post: {
          type: "object",
          required: ["title", "description", "imgUrl", "sender"],
          properties: {
            _id: {
              type: "string",
              description: "Post ID",
              example: "697cc87180aa7bb6865a259d",
            },
            title: {
              type: "string",
              description: "The post title",
              example: "My First Post",
            },
            imgUrl: {
              type: "string",
              description: "URL of the post image",
              example: "https://example.com/image.jpg",
            },
            description: {
              type: "string",
              description: "The post description",
              example: "This is the description of my new post.",
            },
            sender: {
              type: "string",
              description: "ID of the user who created the post",
              example: "697a78c9437f1b91bae9a42d",
            },
          },
        },
        Error: {
          type: "string",
          description: "An error message",
          example: "An error occurred",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
