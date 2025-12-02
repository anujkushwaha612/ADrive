import express from "express";
import checkAuth from "../middlewares/auth.middleware.js";
import { loginUser, registerUser } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/", checkAuth, (req, res) => {
  return res.status(200).json({
    name: req.user.name,
    email: req.user.email,
  });
});

router.post("/logout", checkAuth, (req, res) => {
  res.clearCookie("uid");
  return res.status(204).end();
});

export default router;


