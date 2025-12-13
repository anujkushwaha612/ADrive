import mongoose from "mongoose";
import Directory from "../models/directory.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from 'crypto';
import Session from "../models/session.model.js";
import Otp from "../models/otp.model.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASSWORD // Paste the 16-char App Password here
    }
});

export const registerUser = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { name, email, password, otp } = req.body;
    const userId = new mongoose.Types.ObjectId();
    const rootDirId = new mongoose.Types.ObjectId();

    const hashedPassword = await bcrypt.hash(password, 12);

    const response = await Otp.findOneAndDelete({
      email,
      otp
    });

    // If response is null, it means either email didn't exist OR otp didn't match
    if (!response) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or has expired"
      });
    }

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

export const sendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;

        // 1. Optimization: Use crypto for secure, non-predictable numbers
        // Math.random() is guessable. crypto.randomInt is not.
        const otp = crypto.randomInt(100000, 999999);

        // 2. Optimization: atomic "Upsert" (Update or Insert)
        // Instead of creating a NEW document every time (spamming your DB),
        // we update the existing one if it exists, or create a new one.
        // This ensures 1 Email = 1 Active OTP.
        await Otp.findOneAndUpdate(
            { email },
            { otp, createdAt: Date.now() }, // Reset timer
            {
                upsert: true,
                // new: true,
                // setDefaultsOnInsert: true
            }
        );

        // Note: You can optionally keep the `User.exists` check if you STRICTLY
        // only want to send OTPs to registered users. If this is for signup, remove it.

        // TODO: Add your email sending logic here (NodeMailer, Resend, etc.)
        const html =
            `
        <div style = "font-family:sans-serif;">
        <h2>Your OTP is: ${otp}</h2>
        <p> This OTP is valid for 10 minutes</p>
        <p>Thank you for using our service</p>
        </div>
        `
        await transporter.sendMail({
            from: '"Storage App" <kushwahaanuj0612@gmail.com>', // Sender address
            to: email, // List of receivers
            subject: "Storage App OTP", // Subject line
            html: html,
        });

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully on your email",
        });

    } catch (error) {
        console.error("Send OTP Error:", error);
        next(error);
    }
};
