import express from "express";
import userController from "../controllers/userController";
import {authMiddleware} from "../middlewares/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Update user details
 *     tags: [Users]
 *     security:
 *       - accessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imgUrl:
 *                 type: string
 *                 example: public/uploads/my-profile.jpg
 *               username:
 *                 type: string
 *                 example: exampleUser
 *     responses:
 *       200:
 *         description: User was updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - Invalid user input
 *         content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ZodTreeError'
 *            example:
 *              errors: []
 *              properties:
 *                id:
 *                  errors: ["Invalid input. expected string, received undefined"]
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - You are not authorized to update this user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User was not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id", authMiddleware, userController.put.bind(userController));

export default router;
