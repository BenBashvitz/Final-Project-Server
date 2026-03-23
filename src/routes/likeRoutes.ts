import express from "express";
import likeController from "../controllers/likeController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router({
  mergeParams: true,
});

/**
 * @swagger
 * post/{id}/like:
 *   post:
 *     summary: Like a post
 *     tags: [Likes]
 *     security:
 *       - accessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *     responses:
 *       200:
 *         description: Post was liked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The ID of the liked post
 *                 likeCount:
 *                   type: integer
 *                   description: The total number of likes for the post after the like action
 *                 isLikedByCurrentUser:
 *                   type: boolean
 *                   description: Indicates if the post is liked by the current user
 *       400:
 *         description: Bad request - Invalid post ID
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
 *       404:
 *         description: Post not found
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
router.post("/", authMiddleware, likeController.like);

/**
 * @swagger
 * post/{id}/like:
 *   delete:
 *     summary: Unlike a post
 *     tags: [Likes]
 *     security:
 *       - accessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The post ID
 *     responses:
 *       200:
 *         description: Post was unliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The ID of the unliked post
 *                 likeCount:
 *                   type: integer
 *                   description: The total number of likes for the post after the unlike action
 *                 isLikedByCurrentUser:
 *                   type: boolean
 *                   description: Indicates if the post is liked by the current user
 *       400:
 *         description: Bad request - Invalid post ID
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
 *       404:
 *         description: Post not found
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
router.delete("/", authMiddleware, likeController.unlike);

export default router;
