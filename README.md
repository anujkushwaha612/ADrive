<div align="center">

# My Drive

### A Personal Cloud Storage Platform

A full-stack, Google Drive–inspired file storage application built from the ground up with Express.js, React, MongoDB, and Redis.

[![Node.js](https://img.shields.io/badge/Node.js-v22+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-9.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-5.x-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[Overview](#overview) · [Features](#features) · [Screenshots](#screenshots) · [Architecture](#architecture) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [API Reference](#api-reference) · [Project Structure](#project-structure)

</div>

---

## Overview

**My Drive** is a self-made cloud file storage application that allows users to upload, organize, share, and manage files through a clean, modern web interface. It replicates the core experience of Google Drive while remaining fully open-source and self-contained.

The project was built as a deep exploration of real-world Express.js architecture, covering authentication, session management, file streaming, role-based access control, database transactions, and more.

---

## Screenshots

### Login Page
![Alternative Text](./client/public/Screenshot%202026-05-18%20120442.png)

### Registration with OTP Verification
![Alternative Text](./client/public/Screenshot%202026-05-18%20120458.png)

### Directory View — List Mode
![Alternative Text](./client/public/Screenshot%202026-05-18%20120414.png)

### Directory View — Grid Mode
![Alternative Text](./client/public/Screenshot%202026-05-18%20115614.png)

### File Details Modal
![Alternative Text](./client/public/Screenshot%202026-05-18%20121336.png)

### Share Modal — Email Invitation
![Alternative Text](./client/public/Screenshot%202026-05-18%20115442.png)

### Sharing Dashboard
![Alternative Text](./client/public/Screenshot%202026-05-18%20121728.png) 

### Storage Usage Dropdown
![Alternative Text](./client/public/Screenshot%202026-05-18%20120424.png)


---


## Features

### Authentication and Security

- **Dual Authentication** — Email and password registration with OTP verification via Nodemailer, alongside Google OAuth 2.0 login.
- **Session-Based Authentication** — Secure sessions stored in Redis using signed, HTTP-only cookies.
- **Concurrent Session Limits** — A maximum of two active sessions per user, with the oldest session automatically evicted on overflow.
- **Logout Controls** — Sign out from the current device or from all devices simultaneously.
- **Input Validation** — Server-side validation across all endpoints powered by Zod schemas.

### File Management

- **Streaming Uploads** — Raw binary streaming via `req.pipe()` for memory-efficient uploads with no multipart parsing and no temporary files.
- **Two-Step Upload Protocol** — A pre-flight `init-upload` handshake issues a JWT upload token, which the actual upload request validates before any data is written to disk.
- **Real-Time Size Guard** — Active byte-count monitoring during uploads with a kill switch that severs the connection if the 1 GB limit is breached mid-stream.
- **Integrity Verification** — The final byte count is compared against the declared size after upload, with automatic cleanup on mismatch.
- **Preview and Download** — In-browser previews for images, PDFs, and other supported formats, plus downloads with original filenames preserved.
- **Rename and Delete** — Full CRUD operations with automatic cleanup of both disk and database records.

### Directory System

- **Nested Folders** — Unlimited folder depth with no hierarchical restrictions.
- **Breadcrumb Navigation** — Each directory document stores its full ancestor path, enabling instant breadcrumb rendering without recursive queries.
- **Recursive Deletion** — Deleting a folder removes all nested subdirectories and files from both the database and the physical filesystem.
- **Folder Size Tracking** — Real-time size propagation ensures that uploads and deletions update every ancestor folder up to the root.

### File Sharing

- **Email-Based Sharing** — Invite registered users to collaborate on files via their email address.
- **Role-Based Permissions** — Grant Viewer or Editor access to shared files.
- **Sharing Dashboard** — A dedicated dashboard with "Shared With Me" and "Shared By Me" views.
- **Share Modal** — A polished interface featuring link sharing toggles, email invitations with user search, and a visible list of collaborators.

### Administration Panel

- **User Management** — Admin and Manager roles can view the full registered user base.
- **Online Status** — Real-time online and offline detection determined by querying active Redis sessions.
- **Force Logout** — Administrators and Managers can forcefully terminate any user's active sessions.
- **User Deletion** — Administrators can permanently delete a user and all associated data, including files, directories, and sessions, within a single atomic transaction.
- **Role-Based Access Control** — A three-tier role system spanning `user`, `manager`, and `admin`.

### Frontend Experience

- **Google Drive–Inspired Interface** — A clean, minimal design built with React and Tailwind CSS.
- **Grid and List Views** — Toggle between layouts to suit personal preference.
- **Context Menus** — A kebab menu on each item provides Open, Download, Rename, Share, Details, and Delete actions.
- **File Details Modal** — View complete metadata including type, size, and creation and modification timestamps.
- **Upload Progress Indicators** — Real-time progress bars during uploads, powered by XHR.
- **Toast Notifications** — Refined success, error, and loading toasts via Sonner.
- **Storage Usage Indicator** — A visual progress bar in the header dropdown displaying used versus total storage.
- **Responsive Design** — A mobile-friendly layout with adaptive components throughout.

---


## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (React + Vite)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐   │
│  │  Login / │ │ Directory│ │Dashboard │ │  Admin Panel  │   │
│  │ Register │ │   View   │ │ (Shared) │ │  (User Mgmt)  │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬────────┘   │
│       └────────────┴────────────┴──────────────┘            │
│                         ↕ HTTP + Cookies                    │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                  SERVER (Express.js REST API)               │
│                                                             │
│  ┌─────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Routes  │→ │ Middlewares │→ │Controllers│→│  Models  │   │
│  │         │  │ (Auth, RBAC)│  │ (Business│  │(Mongoose)│   │
│  │ /user   │  │             │  │  Logic)  │  │          │   │
│  │ /file   │  │ checkAuth() │  │          │  │ User     │   │
│  │/directory│ │ validateID()│  │          │  │ File     │   │
│  │ /share  │  │             │  │          │  │ Directory│   │
│  │ /admin  │  └─────────────┘  │          │  │ Session  │   │
│  │ /auth   │                   │          │  │ OTP      │   │
│  └─────────┘                   └──────────┘  └──────────┘   │
│                    ↕                    ↕                   │
│           ┌───────────────┐    ┌──────────────┐             │
│           │     Redis     │    │   MongoDB    │             │
│           │  (Sessions &  │    │ (Users,Files │             │
│           │   Indexes)    │    │  Dirs, OTPs) │             │
│           └───────────────┘    └──────────────┘             │
│                                       ↕                     │
│                               ┌──────────────┐              │
│                               │ Disk Storage │              │
│                               │  ./storage/  │              │
│                               └──────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, React Router v7 | Single-page application with client-side routing |
| **Styling** | Tailwind CSS 4 | Utility-first styling framework |
| **Icons** | Lucide React | Consistent, modern icon set |
| **Toasts** | Sonner | Notification system |
| **Client Authentication** | `@react-oauth/google` | Google One-Tap and OAuth integration |
| **Backend** | Express.js 4 | REST API server |
| **Database** | MongoDB with Mongoose 9 | Document storage with schema validation |
| **Cache and Sessions** | Redis 5 with RedisJSON and RediSearch | Session store with indexed queries |
| **Server Authentication** | `google-auth-library`, JWT, bcrypt | Token verification and password hashing |
| **Validation** | Zod 4 | Runtime schema validation |
| **Email Delivery** | Nodemailer | OTP delivery via Gmail SMTP |
| **File Storage** | Node.js `fs` streams | Direct disk storage with streaming I/O |
| **Development Tools** | Vite, native `--watch` mode | Hot reload for both client and server |

---

## Getting Started

### Prerequisites

- **Node.js** v22 or later (required for the `--env-file` flag)
- **MongoDB** (local installation or Atlas cluster)
- **Redis** with the [RedisJSON](https://redis.io/docs/stack/json/) and [RediSearch](https://redis.io/docs/stack/search/) modules enabled (e.g., [Redis Stack](https://redis.io/docs/stack/))
- A **Google Cloud Console** project with OAuth 2.0 credentials configured

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/my-drive.git
cd my-drive
```

### 2. Set Up the Server

```bash
cd server
npm install
```

Create a `.env` file inside the `server/` directory:

```env
PORT=4000
DB_URL=mongodb://localhost:27017/my-drive
COOKIE_SECRET_KEY=your-cookie-secret
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
FRONTEND_URL=http://localhost:5173
NODEMAILER_USER=your-email@gmail.com
NODEMAILER_PASSWORD=your-gmail-app-password
```

### 3. Initialize the Database

Run the setup script to apply MongoDB schema validations:

```bash
npm run setup
```

### 4. Start Redis

Ensure that Redis Stack is running:

```bash
redis-server
```

### 5. Set Up the Client

```bash
cd ../client
npm install
```

Create a `.env` file inside the `client/` directory:

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

The application will be available at [http://localhost:5173](http://localhost:5173).

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/google` | Log in or register with Google OAuth |
| `POST` | `/user/register` | Register with email, password, and OTP |
| `POST` | `/user/login` | Log in with email and password |
| `POST` | `/user/send-otp` | Send a one-time password to an email address |
| `POST` | `/user/logout` | Log out of the current session |
| `POST` | `/user/logout-all` | Log out from all active devices |
| `GET` | `/user` | Retrieve the current user profile and storage usage |

### Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/file/init-upload` | Pre-flight handshake that validates size and returns an upload token |
| `POST` | `/file/:parentDirId?` | Stream-upload a file to the specified directory |
| `GET` | `/file/:id` | Preview the file in the browser |
| `GET` | `/file/:id?action=download` | Download the file with its original filename |
| `PATCH` | `/file/:id` | Rename the file |
| `DELETE` | `/file/:id` | Delete the file from both disk and database |

### Directories

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/directory/:id?` | Retrieve directory contents, including files and subdirectories |
| `POST` | `/directory/:parentDirId?` | Create a new subdirectory |
| `PATCH` | `/directory/:id` | Rename the directory and propagate updates to descendant breadcrumbs |
| `DELETE` | `/directory/:id` | Recursively delete the directory and all of its contents |

### Sharing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/share/email/:fileId` | Share a file with a registered user by email |
| `GET` | `/share/shared-with-me` | List files shared with the current user |
| `GET` | `/share/shared-by-me` | List files the current user has shared with others |
| `GET` | `/share/shared-with/:fileId` | Retrieve the list of users a specific file is shared with |

### Administration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/users` | Retrieve all users along with their online status *(Admin and Manager)* |
| `POST` | `/admin/logout-user` | Force a user to log out from all sessions *(Admin and Manager)* |
| `DELETE` | `/admin/delete/:userId` | Permanently delete a user and all associated data *(Admin only)* |

---

## Project Structure

```
my-drive/
├── client/                          # React Frontend (Vite)
│   ├── src/
│   │   ├── App.jsx                  # Router configuration
│   │   ├── DirectoryView.jsx        # Main file browser page
│   │   ├── auth/
│   │   │   ├── Login.jsx            # Login page (email and Google)
│   │   │   └── Register.jsx         # Registration with OTP verification
│   │   ├── dashboard/
│   │   │   └── Dashboard.jsx        # Shared files dashboard
│   │   ├── admin/
│   │   │   └── AllUsers.jsx         # Admin user management panel
│   │   ├── components/
│   │   │   ├── Header.jsx           # App header with user menu and storage bar
│   │   │   ├── Toolbar.jsx          # Upload button, view toggle, new folder
│   │   │   ├── Breadcrumbs.jsx      # Directory path breadcrumbs
│   │   │   ├── DriveItem.jsx        # File and folder row (grid and list)
│   │   │   ├── ShareModal.jsx       # Sharing dialog
│   │   │   ├── ToastComponents.jsx  # Custom toast notifications
│   │   │   └── UnauthorizedPage.jsx # 403 error page
│   │   ├── api/
│   │   │   └── loginWithGoogle.js   # Google OAuth API call
│   │   └── utils/
│   │       └── dateAndSize.js       # Date formatting and file size helpers
│   └── index.html
│
├── server/                          # Express.js Backend
│   ├── app.js                       # Server entry point and route mounting
│   ├── redis.js                     # Redis client setup with JSON helpers
│   ├── config/
│   │   ├── db.js                    # MongoDB connection and graceful shutdown
│   │   └── setup.js                 # DB schema validation rules
│   ├── controllers/
│   │   ├── auth.controller.js       # Google OAuth login and registration
│   │   ├── user.controller.js       # Email authentication, OTP, logout
│   │   ├── file.controller.js       # Upload, download, and CRUD
│   │   ├── directory.controller.js  # Folder CRUD and recursive delete
│   │   ├── share.controller.js      # File sharing logic
│   │   └── admin.controller.js      # User management and force logout
│   ├── middlewares/
│   │   ├── auth.middleware.js       # Session verification via Redis
│   │   └── validateID.middleware.js # MongoDB ObjectId validation
│   ├── models/
│   │   ├── user.model.js            # User schema
│   │   ├── file.model.js            # File schema with sharedWith array
│   │   ├── directory.model.js       # Directory schema with path breadcrumbs
│   │   ├── session.model.js         # Session schema (7-day TTL)
│   │   └── otp.model.js             # OTP schema (10-minute TTL)
│   ├── routes/
│   │   ├── auth.route.js            # /auth routes
│   │   ├── user.routes.js           # /user routes
│   │   ├── file.routes.js           # /file routes
│   │   ├── directory.route.js       # /directory routes
│   │   ├── share.route.js           # /share routes
│   │   └── admin.route.js           # /admin routes with inline RBAC
│   ├── services/
│   │   └── googleAuth.js            # Google token verification
│   ├── validators/
│   │   ├── auth.validator.js        # Zod schemas for login and registration
│   │   └── invite.validator.js      # Zod schema for file sharing
│   ├── utils/
│   │   └── folderSize.utils.js      # Recursive folder size updater
│   └── storage/                     # Uploaded files stored on disk
│
└── README.md
```

---

## Key Implementation Details

### Streaming File Uploads

Unlike conventional `multer`-based implementations, files are streamed directly from the request body to disk using `req.pipe(createWriteStream())`. This design yields several benefits:

- **No temporary files** — data flows straight to its final destination.
- **No memory pressure** — the server never buffers the entire file in RAM.
- **Active kill switch** — a `data` event listener tracks bytes in real time and aborts the connection if the configured limit is exceeded.

### Breadcrumb Path Strategy

Rather than recursively querying parent directories to construct breadcrumbs, each directory document stores its full ancestor path as an array:

```js
path: [
  { _id: "rootId",   name: "root-user@gmail.com" },
  { _id: "parentId", name: "Documents" },
  { _id: "selfId",   name: "Projects" }
]
```

This enables **constant-time breadcrumb rendering** on the frontend with no additional database queries.

### Redis Session Architecture

Sessions are stored as RedisJSON documents indexed by `userId` through RediSearch. This design supports:

- Looking up all active sessions for a user, enabling both session-limit enforcement and bulk logout.
- A 7-day automatic expiry through Redis TTL.
- Signed cookies that prevent session identifier tampering.

### MongoDB Schema Validation

Beyond the Mongoose schemas at the application layer, the `setup.js` script applies native MongoDB `$jsonSchema` validators at the collection level. This provides a second line of defense in which even raw inserts through `mongosh` are validated against the schema.

---

## Contributing

Contributions, issues, and feature requests are welcome. Please review the [issues page](https://github.com/your-username/my-drive/issues) before submitting new work.

1. Fork the project.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a pull request.

---

## License

This project is open source and distributed under the [MIT License](LICENSE).

---

<div align="center">

**Built by [Anuj Kushwaha](https://github.com/your-username)**

If you found this project useful, consider giving it a star.

</div>