import express from "express";
import checkAuth from "../middlewares/auth.middleware.js";
import {
  loginUser,
  logoutAllDevices,
  registerUser,
} from "../controllers/user.controller.js";
import Session from "../models/session.model.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/", checkAuth, (req, res) => {
  return res.status(200).json({
    name: req.user.name,
    email: req.user.email,
  });
});

router.post("/logout", checkAuth, async (req, res) => {
  const { sessionId } = req.signedCookies;
  await Session.findByIdAndDelete(sessionId);
  res.clearCookie("sessionId");
  return res.status(204).end();
});

router.post("/logout-all", checkAuth, logoutAllDevices);

export default router;
