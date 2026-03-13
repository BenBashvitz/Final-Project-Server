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
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               description: ID of the last post in the current page, used as a reference for fetching the next page.
 *             creationDate:
 *               type: string
 *               format: date-time
 *               description: Creation date of the last post in the current page, used as a reference for fetching the next page.
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

export default router;
