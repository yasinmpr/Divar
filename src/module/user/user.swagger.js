/**
 * @openapi
 * tags:
 *   - name: User
 *     description: User APIs
 */

/**
 * @openapi
 * /api/user/profile:
 *   get:
 *     tags:
 *       - User
 *     summary: Get current user profile
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "66a123456789abcdef123456"
 *         mobile:
 *           type: string
 *           example: "09123456789"
 *         fullName:
 *           type: string
 *           nullable: true
 *           example: "Peter Parker"
 *         role:
 *           type: string
 *           example: "user"
 */
