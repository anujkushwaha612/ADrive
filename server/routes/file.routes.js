import express from "express";
import { createWriteStream } from "fs";
import { rename, rm, writeFile } from "fs/promises";
import path from "path";
import filesData from '../filesDB.json' with {type: "json"} ;
import foldersData from '../foldersDB.json' with {type: "json"} ;
const router = express.Router();

router.get("/:id", (req, res) => {
  //   const filename = path.join("/", req.params[0]);
  const { id } = req.params;
  const fileData = filesData.find((file) => file.id === id);
  if (!fileData) {
    return res.status(404).json({
      message : "No such file exist",
    });
  }

  if (req.query.action === "download") {
    res.set("content-disposition", `attachment; filename=${fileData.name}`);
  }
  // const readStream = createReadStream(`${import.meta.dirname}/storage/${filename}`);
  // readStream.pipe(res)
  return res.status(200).sendFile(`${process.cwd()}/storage/${id}${fileData.extension}`, (err) => {
    if (!res.headersSent && err) {
      return res.json({
        error: "File not Found",
      });
    }
  });
});

router.post("/:parentDirId?", async (req, res) => {
  try {
    const parentDirId = req.params.parentDirId || foldersData[0].id;
    const filename = req.headers.filename || "untitled"
    const extension = path.extname(filename);
    const id = crypto.randomUUID();

    const writeStream = createWriteStream(`./storage/${id}${extension}`);
    req.pipe(writeStream);

    req.on("end", async () => {
      writeStream.end();
      filesData.push({
        id,
        extension,
        name: filename,
        parentDirId,
      });
      const parentDirData = foldersData.find(
        (folder) => folder.id === parentDirId
      );
      parentDirData.files.push(id);
      await writeFile("./foldersDB.json", JSON.stringify(foldersData));
      await writeFile("./filesDB.json", JSON.stringify(filesData));
      return res.status(201).json({
        message: "File uploaded",
      });
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to upload",
    });
  }
  //   const filename = path.join("/", req.params[0]);
});

router.patch("/:id", async (req, res,next) => {
  try {
    // const filename = path.join("/", req.params[0]);
    const { id } = req.params;
    const fileData = filesData.find((file) => file.id === id);
    if (!fileData) {
    return res.status(404).json({
      message : "No such file exist",
    });
  }
    const { newFilename } = req.body;
    if(!newFilename){
      return res.status(400).json({
        message : "valid filename is reqired"
      })
    }
    // await rename(`./storage/${filename}`, `./storage/${newFilename}`);
    fileData.name = newFilename;
    await writeFile("./filesDB.json", JSON.stringify(filesData));
    return res.status(200).json({
      message: "File renamed successfully",
    });
  } catch (error) {
    error.status = 500;
    error.message = "Failed to rename the file"
    next(error);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    // const filename = path.join("/", req.params[0]);
    // const filePath = `${import.meta.dirname}/storage/${filename}`;
    // console.log(filePath)
    const { id } = req.params;
    const fileIndex = filesData.findIndex((file) => file.id === id);
    if(fileIndex === -1){
      return rename.status(404).json({
        message : "File not found"
      })
    }
    const fileData = filesData[fileIndex];
    const filePath = `./storage/${id}${fileData.extension}`;
    const parentDirData = foldersData.find(
      (folder) => folder.id === fileData.parentDirId
    );

    parentDirData.files = parentDirData.files.filter((fileId) => fileId !== id);
    await rm(filePath, { recursive: true });
    filesData.splice(fileIndex, 1);
    await writeFile("./filesDB.json", JSON.stringify(filesData));
    await writeFile("./foldersDB.json", JSON.stringify(foldersData));
    return res.status(200).json({
      message: "Deleted the file successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message : "Failed to delete the file"
    })
  }
});

export default router;
