import mongoose from "mongoose";
import Directory from "../models/directory.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";

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
}

export const loginUser = async (req, res, next) => {
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
    const cookiePayload = JSON.stringify({
        id: user._id.toString(),
        expiry: Math.round(Date.now() / 1000 + 60 * 60 * 24 * 7)
    })

    res.cookie("token", Buffer.from(cookiePayload).toString("base64url"), {
        httpOnly: true,
        signed: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.json({
        success: true,
        message: "Logged In successfully",
    });
}