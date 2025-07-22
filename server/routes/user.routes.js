import express from "express";
import { writeFile } from "fs/promises";
import foldersData from '../foldersDB.json' with {type: "json"} ;
import usersData from '../usersDB.json' with {type: "json"} ;
import checkAuth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const foundUser = usersData.find((user) => user.email === email);
    if (foundUser) {
      return res.status(409).json({
        error: "User already exist",
        message:
          "user with this email already exists. Please try registering with different email.",
      });
    }

    const userId = crypto.randomUUID();
    const dirId = crypto.randomUUID();
    foldersData.push({
      id: dirId,
      name: `root-${email}`,
      userId,
      parentDirId: null,
      files: [],
      directories: [],
    });
    usersData.push({
      id: userId,
      name,
      email,
      password,
      rootDirId: dirId,
    });
    await writeFile("./foldersDB.json", JSON.stringify(foldersData));
    await writeFile("./usersDB.json", JSON.stringify(usersData));
    return res.status(201).json({
      success: true,
      message: "User created successfully. Login to continue",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  const user = usersData.find((user) => user.email === email);
  if (!user || user.password !== password) {
    return res.status(404).json({
      message: "Invalid credentials",
    });
  }

  res.cookie("uid", user.id, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  return res.json({
    success: true,
    message: "Logged In successfully",
  });
});

router.get("/" , checkAuth , (req,res) => {
  return res.status(200).json({
    name : req.user.name,
    email : req.user.email
  })
})
router.post("/logout" , checkAuth , (req,res) => {
  // res.cookie("uid" , "" , {
  //   maxAge : 0
  // });
  res.clearCookie("uid")
  return res.status(204).end()
})

export default router;
