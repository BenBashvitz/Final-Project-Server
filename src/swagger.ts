import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
import config from "./configs/envVar";

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
                description: "Final Project Server",
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
                User: {
                    type: "object",
                    required: ["_id", "username", "email", "imgUrl"],
                    properties: {
                        _id: {
                            type: "string",
                            description: "The user's ID",
                            example: "697cc87180aa7bb6865a259d",
                        },
                        username: {
                            type: "string",
                            description: "The user's Username",
                            example: "JustAUser"
                        },
                        email: {
                            type: "string",
                            description: "The user's email address",
                            example: "my-email@gmail.com"
                        },
                        imgUrl: {
                            type: "string",
                            description: "URL of the user's profile image",
                            example: "https://example.com/image.jpg",
                        },
                    },
                },
                Post: {
                    type: "object",
                    required: [
                        "description",
                        "user",
                        "imgUrl",
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
                Comment: {
                    type: "object",
                    required: ["_id", "message", "user", "creationDate", "postId"],
                    properties: {
                        _id: {
                            type: "string",
                            description: "Comment ID",
                            example: "697cc87180aa7bb6865a259d",
                        },
                        message: {
                            type: "string",
                            description: "The comment message",
                            example: "This is a comment on the post.",
                        },
                        user: {
                            type: "object",
                            description: "The user who created the comment",
                            example: {
                                _id: "697cc87180aa7bb6865a259d",
                                username: "john_doe",
                                imgUrl: "https://example.com/profile.jpg",
                            },
                        },
                        creationDate: {
                            type: "string",
                            format: "date-time",
                            description: "The date and time when the comment was created",
                            example: "2024-06-01T12:00:00Z",
                        },
                        postId: {
                            type: "string",
                            description: "The ID of the post to which the comment belongs",
                            example: "697cc87180aa7bb6865a259e",
                        },
                    },
                },
            },
        },
    },
    apis: [path.join(__dirname, "routes/*.{ts,js}")],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
