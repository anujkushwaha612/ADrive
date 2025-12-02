import { createWriteStream } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import File from "../models/file.model.js";
import Directory from "../models/directory.model.js";

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

export const uploadFile = async (req, res, next) => {
    try {
        const user = req.user;
        const parentDirId = req.params.parentDirId || user.rootDirId.toString();

        const parentDirData = await Directory.findOne({
            _id: parentDirId,
            userId: user._id,
        }).lean();
        if (!parentDirData) {
            return res.status(404).json({
                error: "Parent directory not found",
            });
        }
        const filename = req.headers.filename || "untitled";
        const extension = path.extname(filename);

        const insertedFile = await File.insertOne({
            extension,
            name: filename,
            parentDirId: parentDirData._id,
            userId: user._id,
        });
        const fileId = insertedFile._id.toString();

        const fullFileName = `${fileId}${extension}`;
        const writeStream = createWriteStream(`./storage/${fullFileName}`);
        req.pipe(writeStream);

        req.on("end", async () => {
            return res.status(201).json({
                message: "File uploaded successfully",
            });
        });

        req.on("error", async () => {
            await File.deleteOne({ _id: insertedFile._id });
            await rm(`./storage/${fullFileName}`);
            return res.status(404).json({
                message: "Failed to upload the file",
            });
        });
    } catch (error) {
        console.log(error);
        error.status = 500;
        error.message = "Failed to upload the file";
        next(error);
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

        const file = await File.findOne({ _id, userId: user._id }).select("extension");
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
        return res.status(200).json({
            message: "Succeessfully deleted the file",
        });
    } catch (error) {
        error.status = 500;
        error.message = "Failed to delte the file";
        next(error);
    }
}