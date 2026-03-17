import express from "express";
import likeController from "../controllers/likeController";

const router = express.Router();

/**
 * @swagger
 * /post/{id}/like:
 *   post:
 *     summary: Like a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
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
 *            schema:
 *              type: object
 *              properties:
 *               _id:
 *                 type: string
 *                 description: The ID of the liked post
 *               likeCount:
 *                 type: integer
 *                 description: The total number of likes for the post after the like action
 *       400:
 *         description: Bad request - Invalid post ID
 *         content:
 *           application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
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
router.post("/:id", likeController.like);

/**
 * @swagger
 * /post/{id}/unlike:
 *   post:
 *     summary: Unlike a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
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
 *            schema:
 *              type: object
 *              properties:
 *               _id:
 *                 type: string
 *                 description: The ID of the unliked post
 *               likeCount:
 *                 type: integer
 *                 description: The total number of likes for the post after the unlike action
 *       400:
 *         description: Bad request - Invalid post ID
 *         content:
 *           application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
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
router.post("/unlike/:id", likeController.unlike);

export default router;
