import express from "express";
import postController from "../controllers/postController";
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
 *         schema:
 *           type: string
 *           description: >
 *             Cursor for paginating through posts, encoded as a JSON string. Omit for the first page.
 *             The JSON object should have the shape:
 *             { "_id": "string", "creationDate": "date-time string" }.
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
 *                 nextCursor:
 *                   type: object
 *                   nullable: true
 *                   description: Cursor to fetch the next page of results. Null if there are no more posts.
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID of the first post in the next page.
 *                     creationDate:
 *                       type: string
 *                       format: date-time
 *                       description: Creation date of the first post in the next page.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", postController.getAll.bind(postController));

export default router;
