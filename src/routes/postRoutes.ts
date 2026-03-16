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
 *       400:
 *        description: Bad request, invalid cursor format
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ZodTreeError'
 *            example:
 *              errors: []
 *              properties:
 *                cursor:
 *                  errors: []
 *                  properties:
 *                    _id:
 *                      errors:
 *                        - Invalid input: expected string, received undefined
 *
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", postController.getAll.bind(postController));

export default router;
