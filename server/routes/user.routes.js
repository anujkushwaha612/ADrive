import express from "express";
import checkAuth from "../middlewares/auth.middleware.js";
import { ObjectId } from "mongodb";
import { client } from "../config/db.js";

const router = express.Router();

router.post("/register", async (req, res, next) => {
  const session = client.startSession();
  try {
    const { name, email, password } = req.body;
    const db = req.db;
    const foundUser = await db.collection("users").findOne({ email });
    if (foundUser) {
      return res.status(409).json({
        error: "User already exist",
        message:
          "user with this email already exists. Please try registering with different email.",
      });
    }

    // const userId = crypto.randomUUID();
    // const dirId = crypto.randomUUID();
    // foldersData.push({
    //   id: dirId,
    //   name: `root-${email}`,
    //   userId,
    //   parentDirId: null,
    //   files: [],
    //   directories: [],
    // });
    // usersData.push({
    //   id: userId,
    //   name,
    //   email,
    //   password,
    //   rootDirId: dirId,
    // });
    // await writeFile("./foldersDB.json", JSON.stringify(foldersData));
    // await writeFile("./usersDB.json", JSON.stringify(usersData));

    const dirCollection = db.collection("directories");
    const userId = new ObjectId();
    const rootDirId = new ObjectId();

    //! Start Transaction
    session.startTransaction();
    await dirCollection.insertOne(
      {
        _id: rootDirId,
        name: `root-${email}`,
        parentDirId: null,
        userId,
      },
      { session }
    );

    await db.collection("users").insertOne(
      {
        _id: userId,
        name,
        email,
        password,
        rootDirId,
      },
      { session }
    );

    session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: "User created successfully. Login to continue",
    });
  } catch (error) {
    session.abortTransaction();
    // if (error.code === 121) {
    //   res.status(400).json({
    //     error: "Invalid Fields",
    //     details: error,
    //   });
    // } else {
    //   next(error);
    // }
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;
  const db = req.db;
  const user = await db.collection("users").findOne({ email, password });
  if (!user) {
    return res.status(404).json({
      message: "Invalid credentials",
    });
  }
  //! user object Id if we try to print it will come as a buffer
  res.cookie("uid", user._id.toString(), {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  return res.json({
    success: true,
    message: "Logged In successfully",
  });
});

router.get("/", checkAuth, (req, res) => {
  return res.status(200).json({
    name: req.user.name,
    email: req.user.email,
  });
});

router.post("/logout", checkAuth, (req, res) => {
  // res.cookie("uid" , "" , {
  //   maxAge : 0
  // });
  res.clearCookie("uid");
  return res.status(204).end();
});

export default router;


