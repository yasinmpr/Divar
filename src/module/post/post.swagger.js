/**
 * @openapi
 * tags:
 *   - name: Post
 *     description: Post APIs
 */

/**
 * @openapi
 * /api/posts:
 *   get:
 *     tags:
 *       - Post
 *     summary: Get posts
 *     description: Returns posts with pagination, sorting and filters.
 *     parameters:
 *       - name: categorySlug
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         example: "car"
 *
 *       - name: city
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         example: "تهران"
 *
 *       - name: neighbourhood
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         example: "سعادت آباد"
 *
 *       - name: hasVideo
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - "true"
 *             - "false"
 *         example: "true"
 *
 *       - name: publishedAfter
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Publication time filter.
 *         example: "1d"
 *
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         example: 1
 *
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         example: 20
 *
 *       - name: sort
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - latest
 *             - oldest
 *         example: latest
 *
 *       - name: color
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Dynamic option filter. The option key is used as the query parameter name.
 *         example: "white"
 *
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *       400:
 *         description: Bad request
 */

/**
 * @openapi
 * /api/posts:
 *   post:
 *     tags:
 *       - Post
 *     summary: Create post
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreatePost'
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /api/posts/{postId}:
 *   get:
 *     tags:
 *       - Post
 *     summary: Get post by ID
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: "66a123456789abcdef123456"
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *       404:
 *         description: Post not found
 *
 *   patch:
 *     tags:
 *       - Post
 *     summary: Update post
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - name: postId
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
 *             $ref: '#/components/schemas/UpdatePost'
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 *
 *   delete:
 *     tags:
 *       - Post
 *     summary: Delete post
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: "66a123456789abcdef123456"
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */

/**
 * @openapi
 * components:
 *   schemas:
 *
 *     CreatePost:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - images
 *         - category
 *         - location
 *         - city
 *         - address
 *       properties:
 *         title:
 *           type: string
 *           minLength: 5
 *           example: "آپارتمان 120 متری"
 *
 *         content:
 *           type: string
 *           minLength: 10
 *           example: "آپارتمان خوش نقشه با نورگیری عالی"
 *
 *         category:
 *           type: string
 *           description: Category slug.
 *           example: "buy-apartment"
 *
 *         city:
 *           type: string
 *           example: "تهران"
 *
 *         neighbourhood:
 *           type: string
 *           example: "سعادت آباد"
 *
 *         address:
 *           type: string
 *           example: "خیابان سرو غربی"
 *
 *         location:
 *           type: string
 *           description: JSON string containing a GeoJSON Point.
 *           example: '{"type":"Point","coordinates":[51.3890,35.6892]}'
 *
 *         options:
 *           type: string
 *           description: JSON string containing post options. Keys are option keys.
 *           example: '{"color":"white","area":"120","rooms":"2"}'
 *
 *         images:
 *           type: array
 *           minItems: 1
 *           maxItems: 19
 *           items:
 *             type: string
 *             format: binary
 *
 *         video:
 *           type: string
 *           format: binary
 *
 *     UpdatePost:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 5
 *           example: "آپارتمان 130 متری"
 *
 *         content:
 *           type: string
 *           minLength: 10
 *           example: "آپارتمان بازسازی شده"
 *
 *         city:
 *           type: string
 *           example: "تهران"
 *
 *         neighbourhood:
 *           type: string
 *           example: "سعادت آباد"
 *
 *         address:
 *           type: string
 *           example: "خیابان سرو غربی"
 *
 *         location:
 *           type: string
 *           description: JSON string containing a GeoJSON Point.
 *           example: '{"type":"Point","coordinates":[51.3890,35.6892]}'
 *
 *         options:
 *           type: string
 *           description: JSON string containing post options.
 *           example: '{"color":"black","area":"130","rooms":"3"}'
 *
 *         existImages:
 *           type: string
 *           description: JSON string containing filenames of images that should remain on the post.
 *           example: '["image1.webp","image2.webp"]'
 *
 *         images:
 *           type: array
 *           maxItems: 19
 *           items:
 *             type: string
 *             format: binary
 *         deleteVideo:
 *           type : string
 *           description : Boolean string to delete video
 *           example : 'false'
 *
 *
 *         video:
 *           type: string
 *           format: binary
 */
