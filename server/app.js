import express from "express";
import cors from "cors";
import directoryRoutes from "./routes/directory.route.js";
import fileRoutes from "./routes/file.routes.js";
import userRoutes from "./routes/user.routes.js";
import cookieParser from "cookie-parser";
import checkAuth from "./middlewares/auth.middleware.js";
import { connectDB } from "./config/db.js";
const mySecretKey = "anuj-StorageApp-secretKey"

await connectDB();

const app = express();
app.use(cookieParser(mySecretKey));
app.use(
  cors({
    origin: "http://localhost:5173", // your frontend origin
    credentials: true, // allow cookies to be sent
  })
);
app.use(express.json());

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


