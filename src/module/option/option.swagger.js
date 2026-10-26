/**
 * @openapi
 * tags:
 *   - name: Option
 *     description: Category option APIs
 */

/**
 * @openapi
 * /api/options:
 *
 *   post:
 *     tags:
 *       - Option
 *     summary: Create option
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOption'
 *     responses:
 *       201:
 *         description: Option created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */

/**
 * @openapi
 * /api/options/category/{categorySlug}:
 *   get:
 *     tags:
 *       - Option
 *     summary: Get options by category
 *     parameters:
 *       - name: categorySlug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: "car"
 *     responses:
 *       200:
 *         description: Options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   type: string
 *                   example: "car"
 *                 options:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Option'
 *       404:
 *         description: Category not found
 */

/**
 * @openapi
 * /api/options/category/by-id/{categoryId}:
 *   get:
 *     tags:
 *       - Option
 *     summary: Get options by category
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: "66a123456789abcdef123456"
 *     responses:
 *       200:
 *         description: Options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   type: string
 *                   example: "car"
 *                 options:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Option'
 *       404:
 *         description: Category not found
 */

/**
 * @openapi
 * /api/options/{optionId}:
 *   get:
 *     tags:
 *       - Option
 *     summary: Get option by ID
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - name: optionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: "66a123456789abcdef123456"
 *     responses:
 *       200:
 *         description: Option retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Option'
 *       404:
 *         description: Option not found
 *
 *   patch:
 *     tags:
 *       - Option
 *     summary: Update option
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - name: optionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: "66a123456789abcdef123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOption'
 *     responses:
 *       200:
 *         description: Option updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Option not found
 *
 *   delete:
 *     tags:
 *       - Option
 *     summary: Delete option
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - name: optionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: "66a123456789abcdef123456"
 *     responses:
 *       200:
 *         description: Option deleted successfully
 *       400:
 *         description: Option cannot be deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Option not found
 */

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     CreateOption:
 *       type: object
 *       required:
 *         - title
 *         - key
 *         - type
 *         - categoryId
 *       properties:
 *         title:
 *           type: string
 *           example: "رنگ"
 *         key:
 *           type: string
 *           example: "color"
 *         type:
 *           type: string
 *           enum:
 *             - string
 *             - number
 *             - boolean
 *             - selection
 *             - multiple
 *           example: "selection"
 *         values:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - "white"
 *             - "black"
 *             - "red"
 *         required:
 *           type: boolean
 *           example: true
 *         guid:
 *           type: string
 *           nullable: true
 *           example: "car-color"
 *         categoryId:
 *           type: string
 *           example: "66a123456789abcdef123456"
 *
 *     UpdateOption:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: "رنگ خودرو"
 *         key:
 *           type: string
 *           example: "color"
 *         type:
 *           type: string
 *           enum:
 *             - string
 *             - number
 *             - boolean
 *             - selection
 *             - multiple
 *           example: "selection"
 *         values:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - "white"
 *             - "black"
 *             - "red"
 *         required:
 *           type: boolean
 *           example: true
 *         guid:
 *           type: string
 *           nullable: true
 *           example: "car-color"
 *
 *     Option:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "66a123456789abcdef123456"
 *         title:
 *           type: string
 *           example: "رنگ"
 *         key:
 *           type: string
 *           example: "color"
 *         type:
 *           type: string
 *           enum:
 *             - string
 *             - number
 *             - boolean
 *             - selection
 *             - multiple
 *         values:
 *           type: array
 *           items:
 *             type: string
 *         required:
 *           type: boolean
 *         guid:
 *           type: string
 *           nullable: true
 *         categoryId:
 *           type: string
 */
