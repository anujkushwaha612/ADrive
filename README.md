<div align="center">

# ADrive

### A Personal Cloud Storage Platform

A full-stack, Google Drive–inspired file storage application. Files live in **Amazon S3**, previews and downloads are served through **signed CloudFront URLs**, and the API is built with Express.js, React, MongoDB, and Redis.

[![Node.js](https://img.shields.io/badge/Node.js-v22+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_9-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-5.x-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![AWS](https://img.shields.io/badge/AWS-S3_+_CloudFront-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[Overview](#overview) · [Features](#features) · [Screenshots](#screenshots) · [Architecture](#architecture) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [API Reference](#api-reference) · [Project Structure](#project-structure)

</div>

---

## Overview

**ADrive** (branded **My Drive** in the UI) is a self-hosted cloud file storage app. Users can upload, organize, preview, share, and manage files through a clean web interface.

The latest iteration moved object storage off the application server. The browser uploads **directly to S3** using a short-lived presigned POST policy. The API never sees the file bytes. Previews and downloads go through **CloudFront signed URLs**, so the bucket can stay private.

The project was built as a deep dive into real-world Express.js architecture: authentication, Redis sessions, role-based access, MongoDB transactions, and AWS object storage.

---

## Screenshots

### Login Page
![Login page](./client/public/Screenshot%202026-05-18%20120442.png)

### Registration with OTP Verification
![Registration with OTP](./client/public/Screenshot%202026-05-18%20120458.png)

### Directory View — List Mode
![Directory list view](./client/public/Screenshot%202026-05-18%20120414.png)

### Directory View — Grid Mode
![Directory grid view](./client/public/Screenshot%202026-05-18%20115614.png)

### File Details Modal
![File details modal](./client/public/Screenshot%202026-05-18%20121336.png)

### Share Modal — Email Invitation
![Share modal](./client/public/Screenshot%202026-05-18%20115442.png)

### Sharing Dashboard
![Sharing dashboard](./client/public/Screenshot%202026-05-18%20121728.png)

### Storage Usage Dropdown
![Storage usage](./client/public/Screenshot%202026-05-18%20120424.png)

---

## Features

### Authentication and Security

- **Dual Authentication** — Email and password registration with a 6-digit OTP sent via Nodemailer (Gmail SMTP), plus Google OAuth 2.0 login.
- **Session-Based Authentication** — Sessions stored as RedisJSON documents, identified by signed HTTP-only cookies.
- **Concurrent Session Limits** — At most two active sessions per user. The oldest session is evicted when a third login happens.
- **Logout Controls** — Sign out of the current device or every device at once.
- **Input Validation** — Zod schemas on login, registration, OTP, and share invitations.

### File Storage (S3 + CloudFront)

- **Direct-to-S3 Uploads** — The client never streams file bytes through Express. A pre-flight `init-upload` call creates a MongoDB file record and returns an S3 **presigned POST** policy.
- **Policy Enforcement** — The POST policy locks `Content-Type` and a `content-length-range` so the client cannot swap the file type or exceed the declared size.
- **Upload Status Handshake** — After S3 accepts the object, the client calls `PATCH /file/status/:id`. The server `HeadObject`s S3, compares byte counts, then marks the file `completed` (or deletes the object and the record on mismatch).
- **CloudFront Delivery** — `GET /file/:id` returns a short-lived signed CloudFront URL (default 5 minutes). The API does not proxy file bytes.
- **In-App Viewer** — Overlay preview for images, PDFs, and video, with zoom, download, print, and share actions.
- **Quota Guard** — Uploads are rejected when they would push the user's root directory past the configured quota (currently **100 MB** in the upload controller).
- **Rename and Delete** — Rename updates only the display name in MongoDB. Delete removes the S3 object first, then the DB record and ancestor folder sizes inside a transaction.

### Directory System

- **Nested Folders** — Unlimited folder depth.
- **Breadcrumb Navigation** — Each directory stores its full ancestor path, so breadcrumbs render without recursive queries.
- **Recursive Deletion** — Deleting a folder collects all descendants, batch-deletes S3 objects (up to 1000 keys per `DeleteObjects` call), then removes files and directories in a single MongoDB transaction.
- **Folder Size Tracking** — Uploads and deletes increment or decrement every ancestor folder up to the root.

### File Sharing

- **Email-Based Sharing** — Invite a registered user by email.
- **Role-Based Permissions** — Grant `viewer` or `editor` access.
- **Sharing Dashboard** — Dedicated page with All / Shared With Me / Shared By Me tabs.
- **Share Modal** — Link tab, email invite tab, and a live "Shared With" collaborator list.

### Administration Panel

- **User Management** — Admin and Manager roles can view every registered user.
- **Online Status** — Derived from active Redis sessions.
- **Force Logout** — Admins and Managers can terminate every session for a user.
- **User Deletion** — Admins can permanently delete a user, their files, directories, and sessions. Admin accounts cannot be deleted.
- **Role-Based Access Control** — Three roles: `user`, `manager`, and `admin`.

### Frontend Experience

- **Google Drive–Inspired Interface** — React 18 + Tailwind CSS 4.
- **Grid and List Views** — Toggle layouts from the toolbar.
- **Context Menus** — Open, Download, Rename, Share, Details, and Delete on every item.
- **File Details Modal** — Type, size, created, and modified timestamps.
- **Upload Progress** — XHR progress bar while the browser posts to S3.
- **Toast Notifications** — Success, error, and loading toasts via Sonner.
- **Storage Usage Indicator** — Used vs. total storage in the header dropdown.
- **Responsive Layout** — Adaptive components for smaller screens.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     CLIENT (React + Vite)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐        │
│  │  Login / │ │ Directory│ │Dashboard │ │  Admin Panel  │        │
│  │ Register │ │ + Viewer │ │ (Shared) │ │  (User Mgmt)  │        │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬────────┘        │
│       └────────────┴────────────┴──────────────┘                 │
│                         ↕ HTTP + Cookies                         │
└──────────────────────────────────────────────────────────────────┘
                              ↕
┌──────────────────────────────────────────────────────────────────┐
│                  SERVER (Express.js REST API)                    │
│                                                                  │
│  ┌─────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Routes  │→ │ Middlewares │→ │Controllers│→│  Models  │        │
│  │ /user   │  │ checkAuth() │  │          │  │ User     │        │
│  │ /file   │  │ validateID()│  │          │  │ File     │        │
│  │/directory│ │   RBAC      │  │          │  │ Directory│        │
│  │ /share  │  └─────────────┘  │          │  │ Session  │        │
│  │ /admin  │                   │          │  │ OTP      │        │
│  │ /auth   │                   └──────────┘  └──────────┘        │
│  └─────────┘                                                     │
│         ↕                    ↕                    ↕              │
│  ┌───────────────┐   ┌──────────────┐   ┌─────────────────────┐  │
│  │     Redis     │   │   MongoDB    │   │  AWS S3 (private)   │  │
│  │  (Sessions &  │   │ Users, Files │   │  objects keyed by   │  │
│  │   Indexes)    │   │ Dirs, OTPs   │   │  {fileId}{ext}      │  │
│  └───────────────┘   └──────────────┘   └──────────┬──────────┘  │
│                                                    ↕             │
│                                         ┌─────────────────────┐  │
│                                         │ CloudFront + signed │  │
│                                         │ URLs (preview / DL) │  │
│                                         └─────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Upload flow

```
Browser                     Express API                      S3
   │                             │                            │
   │  POST /file/init-upload     │                            │
   │  { filename, size, type }   │                            │
   │────────────────────────────>│  create File (uploading)   │
   │                             │  createPresignedPost()     │
   │  { uploadUrl, fields, id }  │                            │
   │<────────────────────────────│                            │
   │                                                          │
   │  POST multipart/form-data (policy fields + file)         │
   │─────────────────────────────────────────────────────────>│
   │                             │                            │
   │  PATCH /file/status/:id     │  HeadObject + size check   │
   │────────────────────────────>│  mark completed / cleanup  │
   │<────────────────────────────│                            │
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, React Router v7 | SPA with client-side routing |
| **Styling** | Tailwind CSS 4 | Utility-first styling |
| **Icons** | Lucide React | Icon set |
| **Toasts** | Sonner | Notifications |
| **Client Auth** | `@react-oauth/google` | Google One-Tap / OAuth |
| **Backend** | Express.js 4 | REST API |
| **Database** | MongoDB + Mongoose 9 | Documents and schema validation |
| **Cache / Sessions** | Redis 5 with RedisJSON and RediSearch | Session store and indexed lookups |
| **Object Storage** | Amazon S3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-presigned-post`) | Private bucket, presigned POST uploads |
| **CDN** | CloudFront (`@aws-sdk/cloudfront-signer`) | Signed URLs for preview and download |
| **Server Auth** | `google-auth-library`, bcrypt | Token verification and password hashing |
| **Validation** | Zod 4 | Runtime schema validation |
| **Email** | Nodemailer | OTP delivery via Gmail SMTP |
| **Dev Tools** | Vite, Node `--watch` | Hot reload for client and server |

---

## Getting Started

### Prerequisites

- **Node.js** v22 or later (required for the `--env-file` flag)
- **MongoDB** (local or Atlas)
- **Redis** with [RedisJSON](https://redis.io/docs/stack/json/) and [RediSearch](https://redis.io/docs/stack/search/) (for example [Redis Stack](https://redis.io/docs/stack/))
- An **AWS** account with:
  - An S3 bucket
  - A CloudFront distribution in front of that bucket
  - A CloudFront key pair (public key uploaded to CloudFront, private key kept locally)
  - A local AWS CLI profile named `storageApp` in region `ap-south-1` (this is what `server/config/s3.config.js` uses)
- A **Google Cloud Console** project with OAuth 2.0 credentials

### 1. Clone the Repository

```bash
git clone https://github.com/anujkushwaha612/ADrive.git
cd ADrive
```

### 2. Set Up the Server

```bash
cd server
npm install
```

Create a `.env` file inside `server/`:

```env
PORT=4000
DB_URL=mongodb://localhost:27017/my-drive
COOKIE_SECRET_KEY=your-cookie-secret
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
FRONTEND_URL=http://localhost:5173
NODEMAILER_USER=your-email@gmail.com
NODEMAILER_PASSWORD=your-gmail-app-password

# AWS
AWS_BUCKET_NAME=your-s3-bucket-name
CLOUDFRONT_DISTRIBUTION_DOMAIN=dxxxxxxxxxxxx.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=APKAEEXAMPLE
CLOUDFRONT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```

Configure the AWS CLI profile the S3 client expects:

```bash
aws configure --profile storageApp
# region: ap-south-1
```

### 3. Initialize the Database

Apply native MongoDB `$jsonSchema` validators:

```bash
npm run setup
```

### 4. Start Redis

```bash
redis-server
```

Use Redis Stack if you do not already have the JSON and Search modules loaded.

### 5. Set Up the Client

```bash
cd ../client
npm install
```

Create a `.env` file inside `client/`:

```env
VITE_BACKEND_BASE_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 6. Launch the Application

**Terminal 1 — Server**

```bash
cd server
npm run dev
```

**Terminal 2 — Client**

```bash
cd client
npm run dev
```

The app is available at [http://localhost:5173](http://localhost:5173).

> A few older client screens still call `http://localhost:4000` directly (login, header, dashboard, admin). Prefer `VITE_BACKEND_BASE_URL` for any new frontend work.

---

## API Reference

All file, directory, share, and admin routes require a valid signed `sessionId` cookie unless noted.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/google` | No | Log in or register with a Google ID token |
| `POST` | `/user/register` | No | Register with name, email, password, and OTP |
| `POST` | `/user/login` | No | Log in with email and password |
| `POST` | `/user/send-otp` | No | Send a 6-digit OTP (10-minute TTL, one active OTP per email) |
| `POST` | `/user/logout` | Yes | End the current session |
| `POST` | `/user/logout-all` | Yes | End every session for the current user |
| `GET` | `/user` | Yes | Current profile, `maxStorage`, and `storageUsed` |

### Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/file/init-upload/:parentDirId?` | Create a file record (`uploadStatus: uploading`) and return an S3 presigned POST (`uploadUrl`, `uploadFields`, `fileId`) |
| `PATCH` | `/file/status/:id` | Confirm the S3 object exists, verify size, mark `completed`, and update folder sizes |
| `GET` | `/file/:id` | Return file metadata plus a CloudFront signed URL for preview / download |
| `PATCH` | `/file/rename/:id` | Rename the file (display name only; S3 key is unchanged) |
| `DELETE` | `/file/:id` | Delete the S3 object, the MongoDB record, and subtract size from ancestors |

### Directories

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/directory/:id?` | Directory contents (files + subdirectories). Omitting `:id` returns the user's root |
| `POST` | `/directory/:parentDirId?` | Create a subdirectory |
| `PATCH` | `/directory/:id` | Rename the directory and update descendant breadcrumbs |
| `DELETE` | `/directory/:id` | Recursively delete the folder, nested files, S3 objects, and size totals |

### Sharing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/share/email/:fileId` | Share a file with a registered user by email (`role`: Viewer or Editor) |
| `GET` | `/share/shared-with-me` | Files shared with the current user |
| `GET` | `/share/shared-by-me` | Files the current user has shared |
| `GET` | `/share/shared-with/:fileId` | Collaborators on a specific file |

### Administration

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/admin/users` | Admin, Manager | All users plus online status |
| `POST` | `/admin/logout-user` | Admin, Manager | Force-logout every session for `{ userId }` |
| `DELETE` | `/admin/delete/:userId` | Admin only | Permanently delete a non-admin user and their data |

---

## Project Structure

```
ADrive/
├── client/                          # React frontend (Vite)
│   ├── public/                      # Screenshots and favicon
│   ├── src/
│   │   ├── App.jsx                  # Router
│   │   ├── DirectoryView.jsx        # File browser + S3 upload flow
│   │   ├── main.jsx                 # GoogleOAuthProvider entry
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.jsx        # Shared files dashboard
│   │   ├── admin/
│   │   │   └── AllUsers.jsx         # Admin user management
│   │   ├── components/
│   │   │   ├── Header.jsx           # User menu + storage bar
│   │   │   ├── Toolbar.jsx          # Upload, view toggle, new folder
│   │   │   ├── Breadcrumbs.jsx
│   │   │   ├── DriveItem.jsx        # File / folder row
│   │   │   ├── FileView.jsx         # Overlay viewer (image / PDF / video)
│   │   │   ├── ShareModal.jsx
│   │   │   ├── ToastComponents.jsx
│   │   │   └── UnauthorizedPage.jsx
│   │   ├── api/
│   │   │   └── loginWithGoogle.js
│   │   └── utils/
│   │       └── dateAndSize.js
│   └── vite.config.js
│
├── server/                          # Express backend
│   ├── app.js                       # Entry point and route mounting
│   ├── redis.js                     # Redis client + JSON helpers
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   ├── setup.js                 # Collection-level $jsonSchema
│   │   ├── s3.config.js             # S3 client (profile: storageApp)
│   │   └── cloudfront.config.js     # Signed URL helper
│   ├── controllers/
│   │   ├── auth.controller.js       # Google OAuth
│   │   ├── user.controller.js       # Email auth, OTP, logout
│   │   ├── file.controller.js       # Preview URL, rename, delete, status
│   │   ├── s3-upload.controller.js  # Presigned POST + quota check
│   │   ├── directory.controller.js  # Folder CRUD + recursive S3 delete
│   │   ├── share.controller.js
│   │   └── admin.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js       # Redis session check
│   │   └── validateID.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── file.model.js            # uploadStatus + sharedWith
│   │   ├── directory.model.js       # path breadcrumbs
│   │   ├── session.model.js
│   │   └── otp.model.js
│   ├── routes/
│   ├── services/googleAuth.js
│   ├── validators/
│   └── utils/folderSize.utils.js
│
└── README.md
```

---

## Key Implementation Details

### Direct-to-S3 Uploads

Files no longer stream through Express (`req.pipe` / local `./storage`). The server only issues a policy:

```js
const { url, fields } = await createPresignedPost(s3, {
  Bucket: process.env.AWS_BUCKET_NAME,
  Key: s3Key, // `${fileId}${extension}`
  Conditions: [
    ["content-length-range", 0, sizeInBytes],
    ["eq", "$Content-Type", contentType],
  ],
  Expires: 300,
});
```

The browser then `POST`s `FormData` (policy fields first, file last) straight to S3. Express never buffers the payload.

### Upload Status and Integrity

File documents start as `uploadStatus: "uploading"`. Confirmation:

1. `HeadObject` on the expected S3 key
2. Compare `ContentLength` to the declared size
3. On match: set `completed` and bump ancestor folder sizes in a transaction
4. On mismatch: delete the S3 object and the MongoDB record

### CloudFront Signed URLs

The bucket stays private. Preview and download use a CloudFront signed URL that expires in 5 minutes by default:

```js
getCloudFrontSignedUrl(fileKey, expiryInSeconds = 300)
```

The overlay viewer (`FileView.jsx`) fetches that URL and renders images, PDFs (iframe), or video. Downloads over 100 MB stream in the browser; smaller files go through a blob download so the original filename is preserved.

### Breadcrumb Path Strategy

Each directory stores its ancestor path:

```js
path: [
  { _id: "rootId",   name: "root-user@gmail.com" },
  { _id: "parentId", name: "Documents" },
  { _id: "selfId",   name: "Projects" }
]
```

Breadcrumbs are constant-time on the client. Renaming a folder updates `path.$.name` for that folder and every descendant.

### Redis Session Architecture

Sessions are RedisJSON documents keyed `session:{uuid}`, indexed by `userId` via RediSearch:

- Look up every active session for a user (session-limit + bulk logout)
- 7-day TTL
- Signed cookies so the session id cannot be tampered with

### MongoDB Schema Validation

`npm run setup` applies native `$jsonSchema` validators on `users`, `directories`, and `files`. That is a second line of defense on top of Mongoose — even raw `mongosh` inserts are checked.

### Transactions

Deletes and upload confirmation wrap the MongoDB writes in a session. S3 mutations happen **before** the transaction because they cannot be rolled back; `DeleteObject` is treated as idempotent.

---

## Contributing

Issues and pull requests are welcome. Please check existing issues first:

https://github.com/anujkushwaha612/ADrive/issues

1. Fork the project.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a pull request.

---

## License

This project is open source. A formal license file is not in the repository yet.

---

<div align="center">

**Built by [Anuj Kushwaha](https://github.com/anujkushwaha612)**

If you found this project useful, consider giving it a star.

</div>
