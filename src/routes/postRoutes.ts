import express from "express";
import postController from "../controllers/postController";
import { authMiddleware } from "../middlewares/authMiddleware";
const router = express.Router();

/**
 * @swagger
 * /post:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: cursor
 *         description: Cursor for paginating through posts. Omit for the first page.
 *         schema:
 *           type: string
 *           example: '{"_id":"60f7c2b8d2f5a2b1c8e4a123","creationDate":"2024-01-01T00:00:00.000Z"}'
 *     responses:
 *       200:
 *         description: Paginated list of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 cursor:
 *                   type: object
 *                   nullable: true
 *                   description: Cursor to fetch the next page of results. Null if there are no more posts.
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID of the last post in the current page, used as a reference for fetching the next page.
 *                     creationDate:
 *                       type: string
 *                       format: date-time
 *                       description: Creation date of the last post in the current page, used as a reference for fetching the next page.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", postController.getAll.bind(postController));

/**
 * @swagger
 * /post:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - imgUrl
 *             properties:
 *               description:
 *                 type: string
 *                 example: This is the description of my new post.
 *               imgUrl:
 *                 type: string
 *                 example: https://example.com/image.jpg
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", postController.post.bind(postController));

export default router;
