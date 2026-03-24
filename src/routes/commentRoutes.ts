import express from "express";
import commentController from "../controllers/commentsController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router({
  mergeParams: true,
});

/**
 * @swagger
 * /post/{postId}/comment:
 *   post:
 *     summary: Create a new comment
 *     tags: [Comments]
 *     security:
 *       - accessToken: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - creationDate
 *             properties:
 *               message:
 *                 type: string
 *               creationDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: The comment was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request - Invalid comment input
 *         content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ZodTreeError'
 *            example:
 *              errors: []
 *              properties:
 *                message:
 *                  errors: ["Invalid input. expected string, received undefined"]
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/",
  authMiddleware,
  commentController.post.bind(commentController),
);

export default router;
