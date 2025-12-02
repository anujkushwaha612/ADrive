import { rm } from "node:fs/promises";
import Directory from "../models/directory.model.js";
import File from "../models/file.model.js";

export const getDirectoryById = async (req, res, next) => {
    try {
        const user = req.user;
        const _id = req.params.id || user.rootDirId.toString();

        const directoryData = await Directory.findOne({
            _id,
            userId: user._id,
        }).lean();
        if (!directoryData) {
            return res.status(404).json({
                message: "Directory not found or you dont have access to this directory",
            });
        }
        const files = await File.find({
            parentDirId: directoryData._id,
        }).lean();

        const directories = await Directory.find({ parentDirId: _id, userId: user._id }).lean();

        return res.status(200).json({
            ...directoryData,
            files: files.map((file) => ({ ...file, id: file._id })),
            directories: directories.map((dir) => ({ ...dir, id: dir._id })),
        });
    } catch (error) {
        error.message = "Failed to get the directory";
        next(error);
    }
}

export const createDirectory = async (req, res, next) => {
    try {
        const user = req.user;
        const parentDirId = req.params.parentDirId || user.rootDirId.toString();

        const parentDirData = await Directory.findOne({
            _id: parentDirId
        }).lean();

        if (!parentDirData) {
            return res.status(404).json({
                message: "Parent directory does not exist",
            });
        }

        const { dirname } = req.body || "New Folder";
        await Directory.insertOne({
            name: dirname,
            parentDirId,
            userId: user._id,
        });
        return res.status(201).json({
            message: "Directory created successfully",
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

export const renameDirectory = async (req, res, next) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { newDirName } = req.body;
        await Directory.updateOne(
            {
                _id: id,
                userId: user._id,
            },
            { $set: { name: newDirName } }
        );
        res.status(200).json({ message: "Directory Renamed!" });
    } catch (error) {
        next(error);
    }
}

export const deleteDirectory = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Find directory
        const parentDirectoryData = await Directory.findOne({ _id: id });
        if (!parentDirectoryData) {
            return res.status(404).json({ message: "Directory not found" });
        }

        // 2. Get all files in directory
        const files = await File.find({
            parentDirId: parentDirectoryData._id,
        }).lean();

        // 3. Get all subdirectories (one level deep)
        const directories = await Directory.find({
            parentDirId: parentDirectoryData._id,
        }).lean();

        // 4. Delete files from storage + DB
        await Promise.all(
            files.map(async (file) => {
                const fileId = file._id?.toString();
                const filePath = `./storage/${fileId}${file.extension}`;
                try {
                    await rm(filePath);
                } catch (err) {
                    console.error(`Failed to delete file: ${filePath}`, err);
                }
                await File.deleteOne({ _id: file._id });
            })
        );

        // 5. Delete subdirectories
        await Promise.all(
            directories.map(async (directory) => {
                await Directory.deleteOne({ _id: directory._id });
            })
        );

        // 6. Delete parent directory
        await Directory.deleteOne({ _id: parentDirectoryData._id });

        return res.status(200).json({
            message: "Directory deleted successfully",
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to delete the directory",
        });
    }
}