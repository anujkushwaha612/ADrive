import mongoose from "mongoose"
import Directory from "../models/directory.model.js"
import File from "../models/file.model.js"
import User from "../models/user.model.js"
import redisClient from "../redis.js"
import path from "path"
import { rm } from "fs/promises"

export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({}, {
            name: 1,
            email: 1,
            _id: 1,
            role: 1
        })

        const redisResult = await redisClient.ft.search("userIdIdx", "*", {
            RETURN: ["userId"],
            LIMIT: { from: 0, size: 10000 }
        })
        const onlineUserIds = new Set();
        redisResult.documents.forEach(doc => {
            onlineUserIds.add(doc.value.userId)
        })
        const usersWithStatus = users.map(user => {
            const userObj = user.toObject();
            return {
                ...userObj,
                isLoggedIn: onlineUserIds.has(user._id.toString())
            }
        })
        return res.status(200).json({ usersWithStatus, role: req.user.role, currentUserId: req.user._id })
    } catch (error) {
        next(error)
    }
}

export const forceLogoutUser = async (req, res, next) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "User id is required" })
        }

        const sessions = await redisClient.ft.search("userIdIdx", `@userId:{${userId}}`, {
            RETURN: []
        })
        if (sessions.total > 0) {
            const sessionIds = sessions.documents.map(doc => doc.id)
            await redisClient.del(sessionIds)
        }
        return res.status(200).json({
            message: `Successfully logged out. Terminated ${sessions.total} sessions.`
        });
    } catch (error) {
        next(error)
    }
}

export const deleteUser = async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ error: "User id is required" })
    }
    const isAdmin = await User.findById({ _id: userId });
    if (isAdmin.role === "admin") {
        return res.status(400).json({ error: "You cannot delete an admin" })
    }
    const session = await mongoose.startSession();
    try {
        const user = await User.findById({ _id: userId });

        if (!user) {
            return res.status(400).json({ error: "User not found!" });
        }

        const sessions = await redisClient.ft.search("userIdIdx", `@userId:{${userId}}`, {
            RETURN: []
        })
        if (sessions.total > 0) {
            const sessionIds = sessions.documents.map(doc => doc.id)
            await redisClient.del(sessionIds)
        }

        session.startTransaction();

        await Directory.deleteMany({ userId }, { session });

        const files = await File.find({ userId });

        await File.deleteMany({ userId }, { session });
        await user.deleteOne({ session });

        await session.commitTransaction();

        for (const file of files) {
            const fileName = `${file.id}${file.extension}`;
            const mainPath = path.resolve("storage", fileName);
            try {
                await rm(mainPath, { recursive: true });
            } catch (err) {
                console.log(`Failed to delete file: ${mainPath}`, err);
            }
        }

        res.status(200).json({
            message: "User and all associated assets deleted successfully.",
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ error: "failed to delete user" });
    } finally {
        session.endSession();
    }
};