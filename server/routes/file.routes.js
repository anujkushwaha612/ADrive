import express from "express";
import { createReadStream, createWriteStream } from "fs";
import { rename, rm, writeFile } from "fs/promises";
import path from "path";
// import filesData from '../filesDB.json' with {type: "json"} ;
// import foldersData from '../foldersDB.json' with {type: "json"} ;
import validateIDMiddleware from "../middlewares/validateID.middleware.js";
import { ObjectId } from "mongodb";
const router = express.Router();

router.param("parentDirId", validateIDMiddleware);
router.param("id", validateIDMiddleware);

router.get("/:id", async (req, res) => {
  //   const filename = path.join("/", req.params[0]);
  const db = req.db;
  const { id } = req.params;
  const user = req.user;
  // const fileData = filesData.find(
  //   (file) => file.id === id && file.userId === user.id
  // );
  // if (!fileData) {
  //   return res.status(404).json({
  //     message: "No such file exist",
  //   });
  // }

  const fileData = await db.collection("files").findOne({
    _id: new ObjectId(id),
  });

  const filePath = `${process.cwd()}/storage/${id}${fileData.extension}`;
  if (req.query.action === "download") {
    // res.set("content-disposition", `attachment; filename=${fileData.name}`);
    return res.download(filePath, fileData.name);
  }
  // const readStream = createReadStream(`${import.meta.dirname}/storage/${filename}`);
  // readStream.pipe(res)
  return res.status(200).sendFile(filePath, (err) => {
    if (!res.headersSent && err) {
      return res.json({
        error: "File not Found",
      });
    }
  });
});

router.post("/:parentDirId?", async (req, res) => {
  try {
    const user = req.user;
    const db = req.db;
    const parentDirId = req.params.parentDirId || user.rootDirId;
    const dirCollection = db.collection("directories");
    const filesCollection = db.collection("files");
    // const id = crypto.randomUUID();

    // const writeStream = createWriteStream(`./storage/${id}${extension}`);
    // req.pipe(writeStream);

    // req.on("end", async () => {
    //   writeStream.end();
    //   filesData.push({
    //     id,
    //     userId: user.id,
    //     extension,
    //     name: filename,
    //     parentDirId,
    //   });
    //   const parentDirData = foldersData.find(
    //     (folder) => folder.id === parentDirId && folder.userId === user.id
    //   );
    //   parentDirData.files.push(id);
    //   await writeFile("./foldersDB.json", JSON.stringify(foldersData));
    //   await writeFile("./filesDB.json", JSON.stringify(filesData));
    //   return res.status(201).json({
    //     message: "File uploaded",
    //   });
    // });

    const parentDirData = await dirCollection.findOne({
      _id: new ObjectId(parentDirId),
      userId: user._id,
    });
    if (!parentDirData) {
      return res.status(404).json({
        error: "Parent directory not found",
      });
    }
    const filename = req.headers.filename || "untitled";
    const extension = path.extname(filename);

    const insertedFile = await filesCollection.insertOne({
      extension,
      name: filename,
      parentDirId: parentDirData._id,
    });

    const fileId = insertedFile.insertedId.toString();

    const fullFileName = `${fileId}${extension}`;
    const writeStream = createWriteStream(`./storage/${fullFileName}`);
    req.pipe(writeStream);

    req.on("end", async () => {
      return res.status(201).json({
        message: "File uploaded successfully",
      });
    });

    req.on("error", async () => {
      await filesCollection.deleteOne({ _id: insertedFile.insertedId });
      return res.status(404).json({
        message: "Failed to upload the file",
      });
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to upload",
    });
  }
  //   const filename = path.join("/", req.params[0]);
});

router.patch("/:id", async (req, res, next) => {
  try {
    // const filename = path.join("/", req.params[0]);
    const db = req.db;
    const { id } = req.params;
    const user = req.user;
    // const fileData = filesData.find(
    //   (file) => file.id === id && file.userId === user.id
    // );
    // if (!fileData) {
    //   return res.status(404).json({
    //     message: "No such file exist",
    //   });
    // }
    const { newFilename } = req.body;
    if (!newFilename) {
      return res.status(400).json({
        message: "valid filename is reqired",
      });
    }
    // await rename(`./storage/${filename}`, `./storage/${newFilename}`);
    // fileData.name = newFilename;
    // await writeFile("./filesDB.json", JSON.stringify(filesData));

    await db
      .collection("files")
      .updateOne({ _id: new ObjectId(id) }, { $set: { name: newFilename } });
    return res.status(200).json({
      message: "File renamed successfully",
    });
  } catch (error) {
    error.status = 500;
    error.message = "Failed to rename the file";
    next(error);
  }
});

// router.delete("/:id", async (req, res) => {
//   try {
//     // const filename = path.join("/", req.params[0]);
//     // const filePath = `${import.meta.dirname}/storage/${filename}`;
//     // console.log(filePath)
//     const { id } = req.params;
//     const user = req.user;
//     const fileIndex = filesData.findIndex(
//       (file) => file.id === id && file.userId === user.id
//     );
//     if (fileIndex === -1) {
//       return rename.status(404).json({
//         message: "File not found",
//       });
//     }
//     const fileData = filesData[fileIndex];
//     const filePath = `./storage/${id}${fileData.extension}`;
//     const parentDirData = foldersData.find(
//       (folder) =>
//         folder.id === fileData.parentDirId && folder.userId === user.id
//     );

//     if (!parentDirData) {
//       return res.status(401).json({
//         message: "Unauthorised access",
//       });
//     }

//     parentDirData.files = parentDirData.files.filter((fileId) => fileId !== id);
//     await rm(filePath);
//     filesData.splice(fileIndex, 1);
//     await writeFile("./filesDB.json", JSON.stringify(filesData));
//     await writeFile("./foldersDB.json", JSON.stringify(foldersData));
//     return res.status(200).json({
//       message: "Deleted the file successfully",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: "Failed to delete the file",
//     });
//   }
// });

router.delete("/:id", async (req, res, next) => {
  try {
    const user = req.user;
    const db = req.db;
    const _id = new ObjectId(req.params.id);
    const filesCollection = db.collection("files");

    const file = await filesCollection.findOne({ _id });
    const filePath = `./storage/${req.params.id}${file.extension}`;
    await rm(filePath);
    await filesCollection.deleteOne({
      _id,
    });
    return res.status(200).json({
      message: "Succeessfully deleted the file",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delte the file",
    });
  }
});

export default router;
