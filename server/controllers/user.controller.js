import mongoose from "mongoose";
import Directory from "../models/directory.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import Session from "../models/session.model.js";

export const registerUser = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { name, email, password } = req.body;
    const userId = new mongoose.Types.ObjectId();
    const rootDirId = new mongoose.Types.ObjectId();

    const hashedPassword = await bcrypt.hash(password, 12);

    //! Start Transaction
    session.startTransaction();
    await Directory.insertOne(
      {
        _id: rootDirId,
        name: `root-${email}`,
        parentDirId: null,
        userId,
      },
      { session }
    );

    await User.insertOne(
      {
        _id: userId,
        name,
        email,
        password: hashedPassword,
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
    if (error.code === 11000 && error.keyPattern.email) {
      return res.status(409).json({
        error: "User already exist",
        message:
          "user with this email already exists. Please try registering with different email.",
      });
    }
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "Invalid credentials",
      });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }
    const usage_count = await Session.countDocuments({ user: user._id });
    if (usage_count >= 2) {
      const oldestSession = await Session.findOneAndDelete({
        user: user._id,
      }).sort({ createdAt: 1 });
      console.log(
        `Deleted oldest session ${oldestSession?._id} for user ${user._id}`
      );
    }

    const session = await Session.create({
      user: user._id,
    });

    res.cookie("sessionId", session.id, {
      httpOnly: true,
      signed: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.json({
      success: true,
      message: "Logged In successfully",
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const logoutAllDevices = async (req, res, next) => {
  try {
    const { sessionId } = req.signedCookies;
    if (!sessionId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    const user = req.user;

    await Session.deleteMany({ user: user._id });
    res.clearCookie("sessionId");
    return res.status(204).end();
  } catch (error) {
    next(error);
  }
};
