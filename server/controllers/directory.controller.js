import { rm } from "node:fs/promises";
import Directory from "../models/directory.model.js";
import File from "../models/file.model.js";
import { handleFolderSizeUpdate } from "../utils/folderSize.utils.js";
import mongoose from "mongoose";

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
        message:
          "Directory not found or you dont have access to this directory",
      });
    }
    const files = await File.find({
      parentDirId: directoryData._id,
    }).lean();

    const directories = await Directory.find({
      parentDirId: _id,
      userId: user._id,
    }).lean();

    return res.status(200).json({
      ...directoryData,
      files: files.map((file) => ({ ...file, id: file._id })),
      directories: directories.map((dir) => ({ ...dir, id: dir._id })),
    });
  } catch (error) {
    console.log(error);
    error.message = "Failed to get the directory";
    next(error);
  }
};

export const createDirectory = async (req, res, next) => {
  try {
    const user = req.user;
    const parentDirId = req.params.parentDirId || user.rootDirId.toString();
    const { dirname } = req.body;

    // 1. Fetch the Parent Directory
    const parentDirData = await Directory.findOne({
      _id: parentDirId,
    }).lean();

    if (!parentDirData) {
      return res.status(404).json({
        message: "Parent directory does not exist",
      });
    }

    // 2. CALCULATE THE PATH (The Logic)
    // The new folder's path is: [Grandparents...] + [Parent]

    // Safety check: ensure parentPath exists, otherwise default to []
    const parentPath = parentDirData.path || [];
    const fileId = new mongoose.Types.ObjectId();

    const newPath = [
      ...parentPath,
      {
        _id: fileId,
        name: dirname || "New Folder"
      }
    ];

    // 3. Create the Directory with the path
    // Note: Use .create() for Mongoose, .insertOne() is for raw MongoDB
    const newDir = await Directory.insertOne({
      _id: fileId,
      name: dirname || "New Folder",
      parentDirId,
      userId: user._id,
      path: newPath, // <--- Storing the full breadcrumb here
    });

    return res.status(201).json({
      message: "Directory created successfully",
      directory: newDir
    });

  } catch (error) {
    console.log(error);
    next(error);
  }
};

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

    await Directory.updateMany(
      {
        "path._id": id  // Find any directory that has this parent in its path
      },
      {
        $set: {
          "path.$.name": newDirName // <--- The '$' updates ONLY the matching array element
        }
      }
    );


    res.status(200).json({ message: "Directory Renamed!" });
  } catch (error) {
    next(error);
  }
};

export const deleteDirectory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const directory = await Directory.findOne({ _id: id, userId: req.user._id });
    if (!directory) {
      return res.status(404).json({ message: "Directory not found" });
    }

    await deleteFolderRecursively(id);

    handleFolderSizeUpdate(directory.parentDirId, -directory.size);

    return res.status(200).json({
      message: "Directory and all nested contents deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const deleteFolderRecursively = async (directoryId) => {
  const files = await File.find({ parentDirId: directoryId }).lean();

  await Promise.all(
    files.map(async (file) => {
      const filePath = `./storage/${file._id}${file.extension}`;
      try {
        await rm(filePath, { force: true });
      } catch (err) {
        console.error(`Failed to delete physical file: ${filePath}`, err);
      }
      await File.deleteOne({ _id: file._id });
    })
  );

  const subDirectories = await Directory.find({ parentDirId: directoryId }).lean();

  await Promise.all(
    subDirectories.map(async (dir) => {
      await deleteFolderRecursively(dir._id);
    })
  );

  await Directory.deleteOne({ _id: directoryId });
};
