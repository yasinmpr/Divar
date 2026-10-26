# Divar — Backend API

A REST API backend for a classifieds marketplace inspired by Divar. The project is built with **Node.js, Express 5, and MongoDB**, with a modular structure for authentication, users, categories, category options, and advertisements.

> This is an educational portfolio project and is not affiliated with Divar.

## Features

- OTP-based authentication using a mobile number
- JWT access and refresh tokens, with refresh tokens stored as hashes
- User profile endpoint
- Hierarchical categories with root-category icons
- Dynamic category options with `string`, `number`, `boolean`, `selection`, and `multiple` types
- Advertisement creation, retrieval, update, and deletion
- Advertisement filtering, pagination, and sorting
- Image and video uploads using multipart form data
- Request validation with Joi
- Centralized error handling
- Rate limiting for general requests, OTP requests, and advertisement modifications
- Security headers with Helmet
- API documentation with Swagger UI in development mode

## Tech Stack

- **Runtime:** Node.js (version `22.12` or newer)
- **Web framework:** Express 5
- **Database / ODM:** MongoDB and Mongoose
- **Authentication:** JSON Web Tokens (`jsonwebtoken`)
- **Validation:** Joi
- **Uploads:** Multer and `file-type`
- **Security and request limits:** Helmet and `express-rate-limit`
- **API documentation:** Swagger UI and `swagger-jsdoc`

## Requirements

- Node.js `22.12` or newer
- npm
- A running MongoDB instance

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yasinmpr/Divar.git
cd Divar
```

Replace the repository URL with the URL of your GitHub repository.

### 2. Install dependencies

```bash
npm ci
```

### 3. Configure environment variables

Copy `.env.example` to `.env`.

On macOS / Linux:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Update `.env` with your local MongoDB connection string and your own secret values:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/divar
JWT_ACCESS_TOKEN_SECRET=replace-with-a-unique-random-secret
JWT_ACCESS_TOKEN_EXPIRE=30m
JWT_REFRESH_TOKEN_SECRET=replace-with-a-different-random-secret
JWT_REFRESH_TOKEN_EXPIRE=15d
OTP_SECRET=replace-with-another-unique-random-secret
NODE_ENV=development
```

Generate strong, unique secrets for each secret variable. Do not use the example values in a real deployment, and **never commit `.env` or production secrets to GitHub**.

### 4. Start the development server

```bash
npm run dev
```

To run the application without Nodemon:

```bash
npm start
```

The server uses port `3000` by default when `PORT=3000` is configured.

### 5. Open the API documentation

With `NODE_ENV=development`, Swagger UI is available at:

```text
http://localhost:3000/docs
```

Swagger UI is disabled when `NODE_ENV` is not set to `development`.

## API Overview

All API routes use the `/api` prefix. Check Swagger UI for request schemas, response formats, and validation details.

| Method   | Endpoint                                  | Description                                       | Access                               |
| -------- | ----------------------------------------- | ------------------------------------------------- | ------------------------------------ |
| `POST`   | `/api/auth/send-otp`                      | Request a one-time password                       | Public, rate-limited                 |
| `POST`   | `/api/auth/check-otp`                     | Verify OTP and log in                             | Public, rate-limited                 |
| `GET`    | `/api/auth/refresh`                       | Obtain a new access token using the refresh token | Refresh token required               |
| `GET`    | `/api/auth/logout`                        | Log out                                           | Authenticated                        |
| `GET`    | `/api/user/profile`                       | Get the current user's profile                    | Authenticated                        |
| `GET`    | `/api/categories`                         | Get the category tree                             | Public                               |
| `GET`    | `/api/categories/:categoryId`             | Get a category by ID                              | Admin                                |
| `POST`   | `/api/categories`                         | Create a category                                 | Admin                                |
| `PATCH`  | `/api/categories/:categoryId`             | Update a category                                 | Admin                                |
| `DELETE` | `/api/categories/:categoryId`             | Delete a category                                 | Admin                                |
| `GET`    | `/api/options/category/:categorySlug`     | Get options for a category by slug                | Public                               |
| `GET`    | `/api/options/category/by-id/:categoryId` | Get options for a category by ID                  | Admin                                |
| `GET`    | `/api/options/:optionId`                  | Get an option by ID                               | Admin                                |
| `POST`   | `/api/options`                            | Create an option                                  | Admin                                |
| `PATCH`  | `/api/options/:optionId`                  | Update an option                                  | Admin                                |
| `DELETE` | `/api/options/:optionId`                  | Delete an option                                  | Admin                                |
| `GET`    | `/api/posts`                              | List and filter advertisements                    | Public                               |
| `GET`    | `/api/posts/:postId`                      | Get an advertisement                              | Public                               |
| `POST`   | `/api/posts`                              | Create an advertisement                           | Authenticated                        |
| `PATCH`  | `/api/posts/:postId`                      | Update an advertisement                           | Authenticated; ownership rules apply |
| `DELETE` | `/api/posts/:postId`                      | Delete an advertisement                           | Authenticated; ownership rules apply |

### Authentication notes

- OTPs are printed to the server console only when `NODE_ENV=development`; a production SMS provider is not configured in this project yet.
- Authentication supports the `access_token` cookie and Bearer access tokens where configured by the route middleware.
- Administrative endpoints require a user whose role is `admin`. There is no public admin-registration endpoint; configure an administrator securely in your development database.

## Advertisement Uploads

Advertisement creation and updates accept `multipart/form-data`. The upload fields are:

- `images`: advertisement images
- `video`: an optional video
- `location`: a JSON string containing a GeoJSON `Point`
- `options`: a JSON string containing the selected category-option values
- `existImages`: used when updating an advertisement to indicate existing images to keep

Review the validation and Swagger schema for the exact accepted request format and current upload limits. Uploaded media is stored under the local `uploads/` directory and served from `/uploads`. The `uploads/` directory is excluded from version control, so uploaded files are not included in the repository.

## Project Structure

```text
.
├── main.js
├── package.json
├── package-lock.json
├── .env.example
├── public/
└── src/
    ├── app.routes.js
    ├── config/
    ├── common/
    │   ├── exception handling and middleware
    │   ├── JWT utilities
    │   └── shared file utilities
    └── module/
        ├── auth/
        ├── user/
        ├── category/
        ├── option/
        └── post/
```

Each feature module contains its routes and separates controller, service, model, validation, and Swagger documentation where applicable.

## Current Scope

This repository contains the backend API. A frontend, production SMS integration, and a database seed script are not included yet.

## Security Notes

- Keep environment files, tokens, database credentials, and uploaded user media out of version control.
- Use HTTPS and production-appropriate cookie settings when deploying publicly.
- Configure production secrets through the deployment platform's environment settings.
- Review rate limits and upload limits for the expected traffic before public deployment.

## License

No separate license file is currently included. Add a `LICENSE` file before granting others explicit reuse rights.
