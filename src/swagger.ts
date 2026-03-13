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
        url: `${process.env.SERVER_URL}:${process.env.PORT}`,
        description: "Final Project Server",
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
          required: [
            "description",
            "user",
            "likeCount",
            "commentCount",
            "creationDate",
            "isLikedByCurrentUser",
            "_id",
          ],
          properties: {
            _id: {
              type: "string",
              description: "Post ID",
              example: "697cc87180aa7bb6865a259d",
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
            user: {
              type: "object",
              description: "The user who created the post",
              example: {
                _id: "697cc87180aa7bb6865a259d",
                username: "john_doe",
                imgUrl: "https://example.com/profile.jpg",
              },
            },
            likeCount: {
              type: "integer",
              description: "Number of likes the post has received",
              example: 5,
            },
            commentCount: {
              type: "integer",
              description: "Number of comments the post has received",
              example: 3,
            },
            creationDate: {
              type: "string",
              format: "date-time",
              description: "The date and time when the post was created",
              example: "2024-06-01T12:00:00Z",
            },
            isLikedByCurrentUser: {
              type: "boolean",
              description: "Indicates if the current user has liked the post",
              example: true,
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
