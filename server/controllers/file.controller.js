import { createWriteStream } from "node:fs";
import { rm } from "node:fs/promises";
import jwt from "jsonwebtoken";
import path from "node:path";
import File from "../models/file.model.js";
import Directory from "../models/directory.model.js";
import { handleFolderSizeUpdate } from "../utils/folderSize.utils.js";

export const getFileById = async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    const fileData = await File.findOne({
        _id: id,
        userId: user._id,
    }).lean();

    if (!fileData) {
        return res.status(404).json({
            message: "File not found",
        });
    }

    const filePath = `${process.cwd()}/storage/${id}${fileData.extension}`;
    if (req.query.action === "download") {
        return res.download(filePath, fileData.name);
    }
    return res.status(200).sendFile(filePath, (err) => {
        if (!res.headersSent && err) {
            return res.json({
                error: "File not Found",
            });
        }
    });
}

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB in bytes

export const initUpload = async (req, res) => {
    try {
        const {filename, filesize} = req.body;
        const MAX_LIMIT = 1024 * 1024 * 1024; // 1GB

        // Check 1: Is it too big?
        if (filesize > MAX_LIMIT) {
            return res.status(413).json({
                message: "File too large. Please upload files smaller than 1GB."
            });
        }

        // Check 2: (Optional) Do you have enough disk space?
        // Check 3: (Optional) Is the file type allowed?

        // If all good, issue a "Upload Token"
        // This prevents users from bypassing this check and hitting the upload route directly
        const uploadToken = jwt.sign(
            {
                allowed: true,
                filename,
                expectedSize: filesize
            },
            process.env.JWT_SECRET,
            { expiresIn: '15m' } // Token valid for 15 mins
        );

        return res.status(200).json({
            message: "Upload approved",
            uploadToken
        });

    } catch (error) {
        return res.status(500).json({ error: "Failed to initialize upload" });
    }
};

export const uploadFile = async (req, res, next) => {
    let fileId = null;
    let fullFileName = null;
    let filePath = null;

    try {
        const user = req.user;
        const parentDirId = req.params.parentDirId || user.rootDirId.toString();

        const token = req.headers['x-upload-token'];
        if (!token) return res.status(403).json({ error: "No upload token found" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.allowed) return res.status(403).json({ error: "Upload not approved" });

        // Double check: Did they swap the file after getting permission?
        if (req.headers.filesize > decoded.expectedSize) {
            return res.status(400).json({ error: "File size does not match approved token" });
        }

        // --- LAYER 1: PASSIVE CHECK (Headers) ---
        // We check this BEFORE touching the DB or Disk to save resources.
        const expectedSize = parseInt(req.headers.filesize || "0", 10);

        // 1. Validate Parent Directory
        const parentDirData = await Directory.findOne({
            _id: parentDirId,
            userId: user._id,
        }).lean();

        if (!parentDirData) {
            return res.status(404).json({ error: "Parent directory not found" });
        }

        const filename = req.headers.filename || "untitled";
        const extension = path.extname(filename);

        // 2. Create DB Entry (Optimistic)
        const insertedFile = await File.insertOne({
            extension,
            name: filename,
            size: expectedSize,
            parentDirId: parentDirData._id,
            userId: user._id,
        });

        fileId = insertedFile._id.toString();
        fullFileName = `${fileId}${extension}`;
        filePath = `./storage/${fullFileName}`;

        const writeStream = createWriteStream(filePath);

        // Start piping data
        req.pipe(writeStream);

        // --- LAYER 2: ACTIVE MONITORING (Real-time) ---
        let uploadedBytes = 0;
        let isLimitExceeded = false;

        req.on('data', async (chunk) => {
            uploadedBytes += chunk.length;

            // THE KILL SWITCH
            if (!isLimitExceeded && uploadedBytes > MAX_FILE_SIZE) {
                isLimitExceeded = true; // Prevent multiple triggers

                console.warn(`Upload limit exceeded for file ${fileId}. Aborting.`);

                // 1. Cut the connection immediately
                req.unpipe(writeStream);
                req.pause();
                writeStream.destroy(); // Stops writing to disk

                // 2. Cleanup and Respond
                await cleanup(fileId, filePath);

                // 3. Send 413 "Payload Too Large"
                if (!res.headersSent) {
                    return res.status(413).json({
                        message: "Upload exceeded the 1GB limit."
                    });
                }
            }
        });

        // ERROR Handling
        const handleError = async (err) => {
            if (isLimitExceeded) return; // Already handled by the kill switch
            await cleanup(fileId, filePath);
            if (!res.headersSent) res.status(500).json({ message: "File upload failed" });
        };

        writeStream.on('error', handleError);
        req.on('error', handleError);

        // SUCCESS Handling
        writeStream.on('finish', async () => {
            if (isLimitExceeded) return; // Ignore finish event if we already killed it

            const actualSize = writeStream.bytesWritten;

            // Final Integrity Check (Mismatch Check)
            if (expectedSize > 0 && actualSize !== expectedSize) {
                await cleanup(fileId, filePath);
                return res.status(400).json({
                    message: "Integrity check failed. Size mismatch."
                });
            }

            // Success!
            handleFolderSizeUpdate(parentDirData._id, actualSize);
            return res.status(201).json({
                message: "File uploaded successfully",
                fileId: fileId,
                size: actualSize
            });
        });

    } catch (error) {
        if (fileId) await cleanup(fileId, filePath);
        next(error);
    }
};

// Helper function to keep code DRY (Don't Repeat Yourself)
async function cleanup(fileId, filePath) {
    try {
        await File.deleteOne({ _id: fileId });
        await rm(filePath);
    } catch (err) {
        console.error("Cleanup failed:", err);
    }
}

export const renameFile = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;

        const { newFilename } = req.body;
        if (!newFilename) {
            return res.status(400).json({
                message: "valid filename is reqired",
            });
        }

        await File.updateOne(
            { _id: id, userId: user._id },
            { $set: { name: newFilename } }
        );
        return res.status(200).json({
            message: "File renamed successfully",
        });
    } catch (error) {
        error.status = 500;
        error.message = "Failed to rename the file";
        next(error);
    }
}

export const deleteFile = async (req, res, next) => {
    try {
        const user = req.user;
        const _id = req.params.id;

        const file = await File.findOne({ _id, userId: user._id },{
            extension: 1,
            parentDirId: 1,
            size: 1,
        })
        if (!file) {
            return res.status(404).json({
                message: "File not found",
            });
        }
        const filePath = `./storage/${_id}${file.extension}`;
        await rm(filePath);
        await File.deleteOne({
            _id,
            userId: user._id,
        });

        handleFolderSizeUpdate(file.parentDirId, -file.size);
        return res.status(200).json({
            message: "Succeessfully deleted the file",
        });
    } catch (error) {
        console.log(error);
        error.status = 500;
        error.message = "Failed to delte the file";
        next(error);
    }
}