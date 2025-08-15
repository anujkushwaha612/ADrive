import express from "express";
import cors from "cors";
import directoryRoutes from "./routes/directory.route.js";
import fileRoutes from "./routes/file.routes.js";
import userRoutes from "./routes/user.routes.js";
import cookieParser from "cookie-parser";
import checkAuth from "./middlewares/auth.middleware.js";
import { connectDB } from "./db.js";

try {
  const db = await connectDB();
  const app = express();
  app.use(cookieParser());
  app.use(
    cors({
      origin: "http://localhost:5173", // your frontend origin
      credentials: true, // allow cookies to be sent
    })
  );
  app.use(express.json());

  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  app.use("/directory", checkAuth, directoryRoutes);
  app.use("/file", checkAuth, fileRoutes);
  app.use("/user", userRoutes);

  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
      message: err.message || "error occurred",
    });
  });

  app.listen(4000, () => {
    console.log(`Server Started`);
  });
} catch (error) {
  console.log(error);
}

// Enabling CORS
// app.use((req, res, next) => {
//   // res.set("Access-Control-Allow-Origin", "*");
//   // res.set("Access-Control-Allow-Methods", "*");

//   //? we can also set headers in a onject in form of key value pairs
//   res.set({
//     "Access-Control-Allow-Origin": "*",
//     "Access-Control-Allow-Methods": "*",
//     "Access-Control-Allow-Headers": "*",
//   });
//   next();
// });

// Serving File
// const staticHandler = express.static("storage");

// app.use((req, res, next) => {
//   if (req.query.action === "download") {
//     res.set("Content-Disposition", "attachment");
//   }
//   staticHandler(req, res, next);
// });

// Serving Dir Content
// app.get("/directory", async (req, res) => {
//   try {
//     // Read the directory and get file types as well
//     const dirEntries = await fs.readdir("./storage", { withFileTypes: true });
//     // Map to an array of objects with name and type info
//     const filesList = dirEntries.map((entry) => ({
//       name: entry.name,
//       type: entry.isDirectory() ? "directory" : "file",
//     }));
//     res.json(filesList);
//   } catch (err) {
//     res.status(500).json({ error: err.toString() });
//   }
// });
