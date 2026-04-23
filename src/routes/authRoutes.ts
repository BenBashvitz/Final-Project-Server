import express from "express";
import authController from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               username:
 *                 type: string
 *                 example: newUser
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ZodTreeError'
 *             example:
 *               errors: []
 *               properties:
 *                 email:
 *                   errors:
 *                     - Invalid input: expected email, received undefined
 *       409:
 *         description: Duplicate Key Error
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
router.post("/register", authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: newUser
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ZodTreeError'
 *             example:
 *               errors: []
 *               properties:
 *                 username:
 *                   errors:
 *                     - Invalid input: expected string, received undefined
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     security:
 *       - refreshToken: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid refresh token
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
router.post("/refresh-token", authController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Auth]
 *     security:
 *       - accessToken: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized - Invalid access token
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
router.post("/logout", authMiddleware, authController.logout);

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Sign in using Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *             properties:
 *               credential:
 *                 type: string
 *                 example: eyJhbGciOiJSUzI1NiIsImtpZCI6ImExMGasqwertyuihveY2ZWM1NmJkYTZlYjNiZDQ1NDM5ZjM1ZDciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI3MTE1NjAyMzM5MzgtZm9oYm9kNHBqZXNnNWZuOGs4czgxYzVyMW1kNHUxZXUuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI3MTE1NjAyMzM5MzgtZm9oYm9kNHBqZXNnNWZuOGs4czgxYzVyMW1kNHUxZXUuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDQxMzI5OTc0NTQ4NTk1NTQ0ODAiLCJlbWFpbCI6ImJhc2h2aXR6YmVuQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYmYiOjE3NzQ2Mzg3MTAsIm5hbWUiOiJiZW4gYmFzaHZpdHogKFRoZUZyaTNuZGx5UGFuZGEpIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0tMTGxEUnZIQkRGRmpaOWJjOXFSaTVld05EYzlWQkN6ZDFZa2NSU2N1U1dhdnBwdz1zOTYtYyIsImdpdmVuX25hbWUiOiJiZW4iLCJmYW1pbHlfbmFtZSI6ImJhc2h2aXR6IiwiaWF0IjoxNzc0NjM5MDEwLCJleHAiOjE3NzQ2NDI2MTAsImp0aSI6ImNiZWYwZTNkNzA4NDYwNTRiYzBjMDUyMGNlMWRhNWU0ZDdkNzBmZmUifQ.ema2GGlYXtq4J6wzHRSySagB-D8Db3xdZitn5bDQ8AtBdC8ACw0e1iLniX89HwoQZDKdmfqbOaOgTwaFl9wEIZ9xqXFBqTMF9FTDEn4HVGJ9loGuf9HvKvrk5FiYm4SLPnEWKUJivsPR-GGP3jAPH91nfOiC3li27FDRKy5QlhIGvCBAc9Qvhw96Lu5f5dkOlXcEx0rRWrSuoVIbwtJLmZET9qwertNJCLzTP8Qhph0k5smL8Vw-R1XY27kporvasdfgSJi9Mi6YeIANaSkqz334NrFn3pn47KE9LlMWYQ4vOlr1YbzzLxEh1VmL42ou5yeAq2LLuM7VoskmI7iYcA
 *     responses:
 *       200:
 *         description: User successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request - Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ZodTreeError'
 *             example:
 *               errors: []
 *               properties:
 *                 credential:
 *                   errors:
 *                     - Invalid input: expected google oauth credential, received undefined
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/google", authController.googleSignIn);

export default router;
