/**
 * @openapi
 * tags:
 *   - name: Category
 *     description: Category APIs
 */

/**
 * @openapi
 * /api/categories:
 *   post:
 *     tags:
 *       - Category
 *     summary: Create category
 *     description: Creates a category. Root categories require an icon.
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategory'
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */

/**
 * @openapi
 * /api/categories:
 *   get:
 *     tags:
 *       - Category
 *     summary: Get all categories
 *     description: Returns all categories with their children.
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */

/**
 * @openapi
 * /api/categories/{categoryId}:
 *   get:
 *     tags:
 *       - Category
 *     summary: get category by id
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: "66a123456789abcdef123456"
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Category not found
 *   patch:
 *     tags:
 *       - Category
 *     summary: Update category
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: "66a123456789abcdef123456"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategory'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Category not found
 *
 *   delete:
 *     tags:
 *       - Category
 *     summary: Delete category
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: "66a123456789abcdef123456"
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Category cannot be deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Category not found
 */

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     CreateCategory:
 *       type: object
 *       required:
 *         - title
 *         - slug
 *       properties:
 *         title:
 *           type: string
 *           example: "ماشین"
 *         slug:
 *           type: string
 *           example: "car"
 *         parentId:
 *           type: string
 *           nullable: true
 *           description: Parent category ID. Null or omitted for root category.
 *           example: "66a123456789abcdef123456"
 *         icon:
 *           type: string
 *           format: binary
 *           description: Required only for root categories.
 *
 *     UpdateCategory:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: "ماشین و وسایل نقلیه"
 *         slug:
 *           type: string
 *           example: "vehicles"
 *         parentId:
 *           type: string
 *           nullable: true
 *           example: "66a123456789abcdef123456"
 *         icon:
 *           type: string
 *           format: binary
 *         deleteIcon:
 *           type: boolean
 *           example: true
 *
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "66a123456789abcdef123456"
 *         title:
 *           type: string
 *           example: "ماشین"
 *         slug:
 *           type: string
 *           example: "car"
 *         parentId:
 *           type: string
 *           nullable: true
 *           example: null
 *         icon:
 *           type: string
 *           nullable: true
 *           example: "/uploads/categories/car/icon.webp"
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 */
