/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Authentication APIs
 */

/**
 * @openapi
 * /api/auth/send-otp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Send OTP
 *     description: Sends an OTP code to the specified mobile number.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendOtp'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: User is already authenticated
 */

/**
 * @openapi
 * /api/auth/check-otp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify OTP and login
 *     description: Verifies the OTP and authenticates the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckOtp'
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Bad request
 *       401:
 *         description: Invalid OTP
 */

/**
 * @openapi
 * /api/auth/refresh:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Refresh access token
 *     description: Creates a new access token using the refresh token.
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *       401:
 *         description: Refresh token is missing or invalid
 */

/**
 * @openapi
 * /api/auth/logout:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Logout
 *     description: Logs out the authenticated user.
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     SendOtp:
 *       type: object
 *       required:
 *         - mobile
 *       properties:
 *         mobile:
 *           type: string
 *           example: "09123456789"
 *
 *     CheckOtp:
 *       type: object
 *       required:
 *         - mobile
 *         - code
 *       properties:
 *         mobile:
 *           type: string
 *           example: "09123456789"
 *         code:
 *           type: string
 *           example: "12345"
 */
