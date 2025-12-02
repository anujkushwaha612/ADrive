import mongoose from "mongoose";
import Directory from "../models/directory.model.js";
import User from "../models/user.model.js";

export const registerUser = async (req, res, next) => {
    const session = await mongoose.startSession();
    try {
        const { name, email, password } = req.body;
        const foundUser = await User.findOne({ email });
        if (foundUser) {
            return res.status(409).json({
                error: "User already exist",
                message:
                    "user with this email already exists. Please try registering with different email.",
            });
        }

        // const dirCollection = db.collection("directories");
        const userId = new mongoose.Types.ObjectId();
        const rootDirId = new mongoose.Types.ObjectId();

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
        next(error);
    }
}

export const loginUser = async (req, res, next) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) {
        return res.status(404).json({
            message: "Invalid credentials",
        });
    }
    res.cookie("uid", user._id.toString(), {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.json({
        success: true,
        message: "Logged In successfully",
    });
}