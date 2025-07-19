import React from "react";
import { useRef } from "react";
import { useState } from "react";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

const DirectoryView = () => {
  const BASE_URL = "http://192.168.1.10:4000";
  const { dirId } = useParams();
  const [directoryItems, setDirectoryItems] = useState([]);
  const [directoriesList, setDirectoriesList] = useState([]);
  const [filesList, setFilesList] = useState([]);
  const [progress, setProgress] = useState(0);
  const [renamingFile, setRenamingFile] = useState(null); // filename being renamed
  const [newFilename, setNewFilename] = useState("");
  const [directoryname, setDirectoryname] = useState("");
  const inputRef = useRef(null);

  async function getDirectoryItems() {
    const response = await fetch(`${BASE_URL}/directory/${dirId || ""}`);
    const data = await response.json();
    setDirectoriesList(data.directories);
    setFilesList(data.files);
  }

  useEffect(() => {
    getDirectoryItems();
  }, [dirId]);

  async function uploadFile(e) {
    const file = e.target.files[0];
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/file/${dirId || ""}`, true);
    xhr.setRequestHeader("filename", `${file.name}`);
    xhr.addEventListener("load", () => {
      getDirectoryItems();
      setProgress(0);
      inputRef.current.value = "";
    });
    xhr.upload.addEventListener("progress", (e) => {
      const totalProgress = (e.loaded / e.total) * 100;
      setProgress(totalProgress.toFixed(2));
    });
    xhr.send(file);
  }

  async function handleFileDelete(fileId) {
    const response = await fetch(`${BASE_URL}/file/${fileId}`, {
      method: "DELETE",
    });
    const data = await response.text();
    console.log(data);
    getDirectoryItems();
  }
  function renameFile(oldFilename) {
    setRenamingFile(oldFilename);
    setNewFilename(oldFilename);
  }

  async function handleDirectoryDelete(directoryId) {
    const response = await fetch(`${BASE_URL}/directory/${directoryId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    console.log(data);
    getDirectoryItems();
  }
  
  function renameFile(oldFilename) {
    setRenamingFile(oldFilename);
    setNewFilename(oldFilename);
  }

  async function saveFile(fileId) {
    const response = await fetch(`${BASE_URL}/file/${fileId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        newFilename,
      }),
    });

    const data = await response.json();
    console.log(data);

    setRenamingFile(null);
    setNewFilename("");
    getDirectoryItems();
  }

  async function saveDirectory(directoryId) {
    const response = await fetch(`${BASE_URL}/directory/${directoryId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        newDirname : newFilename,
      }),
    });

    const data = await response.text();
    console.log(data);

    setRenamingFile(null);
    setNewFilename("");
    getDirectoryItems();
  }

  async function handleCreateDirectory(e) {
    e.preventDefault();
    const response = await fetch(`${BASE_URL}/directory/${dirId || ""}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", //! 👈 Add this line
      },
      body: JSON.stringify({
        dirname: directoryname,
      }),
    });
    await response.json();
    setDirectoryname("");
    getDirectoryItems();
  }
  return (
    <div>
      <h1 className="text-2xl mb-6">My Files</h1>
      <div className="flex flex-col gap-3">
        <input
          className="border border-black w-fit"
          type="file"
          onChange={uploadFile}
          ref={inputRef}
        />
        <p className="mt-1 mb-5">Progress:- {progress}</p>
      </div>
      <form onSubmit={handleCreateDirectory} className="flex gap-4 my-4">
        <input
          className="border border-black w-fit"
          type="text"
          onChange={(e) => setDirectoryname(e.target.value)}
          value={directoryname}
          placeholder="Folder Name"
        />
        <button className="cursor-pointer">Create Folder</button>
      </form>
      {directoriesList.map(({ id, name }) => (
        <div key={id} className="flex gap-4 mb-3">
          {renamingFile === name ? (
            <input
              className="border border-black w-fit"
              type="text"
              onChange={(e) => setNewFilename(e.target.value)}
              value={newFilename}
            />
          ) : (
            <div>{name}</div>
          )}
          <div className="flex gap-4">
            <Link className="text-blue-300" to={`/directory/${id}`}>
              Open
            </Link>

            {renamingFile === name ? (
              <a
                onClick={() => saveDirectory(id)}
                className="text-yellow-500 cursor-pointer"
              >
                Save
              </a>
            ) : (
              <a
                onClick={() => renameFile(name)}
                className="text-yellow-500 cursor-pointer"
              >
                Rename
              </a>
            )}
            <a
              onClick={() => handleDirectoryDelete(id)}
              className="text-red-600 cursor-pointer"
            >
              Delete
            </a>
          </div>
        </div>
      ))}

      {filesList.map(({ name, id }) => (
        <div key={id} className="flex gap-4 mb-3">
          {renamingFile === name ? (
            <input
              className="border border-black w-fit"
              type="text"
              onChange={(e) => setNewFilename(e.target.value)}
              value={newFilename}
            />
          ) : (
            <div>{name}</div>
          )}

          <div className="flex gap-4">
            <Link className="text-blue-300" to={`${BASE_URL}/file/${id}`}>
              Open
            </Link>
            <a
              className="text-green-500"
              href={`${BASE_URL}/file/${id}?action=download`}
            >
              Download
            </a>

            {renamingFile === name ? (
              <a
                onClick={() => saveFile(id)}
                className="text-yellow-500 cursor-pointer"
              >
                Save
              </a>
            ) : (
              <a
                onClick={() => renameFile(name)}
                className="text-yellow-500 cursor-pointer"
              >
                Rename
              </a>
            )}
            <a
              onClick={() => handleFileDelete(id)}
              className="text-red-600 cursor-pointer"
            >
              Delete
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DirectoryView;
