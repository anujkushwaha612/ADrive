import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Upload,
  FolderPlus,
  Folder,
  File,
  Download,
  Edit,
  Trash2,
  Check,
  X,
  Grid,
  List,
  Search,
  User,
  Settings,
} from "lucide-react";
import Header from "./Header";

// Toolbar Component
const Toolbar = ({
  onUploadClick,
  onCreateFolder,
  viewMode,
  setViewMode,
  uploadProgress,
  isCreatingFolder,
  setIsCreatingFolder,
  newFolderName,
  setNewFolderName,
  handleCreateDirectory,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onUploadClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>

          <button
            onClick={() => setIsCreatingFolder(true)}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Folder</span>
          </button>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">{uploadProgress}%</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg ${
              viewMode === "grid"
                ? "bg-gray-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg ${
              viewMode === "list"
                ? "bg-gray-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isCreatingFolder && (
        <div className="mt-4 flex items-center space-x-3">
          <input
            type="text"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 flex-1 max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={handleCreateDirectory}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsCreatingFolder(false);
              setNewFolderName("");
            }}
            className="border border-gray-300 text-gray-600 p-2 rounded-lg hover:bg-gray-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// Item Component (for both files and folders)
const DriveItem = ({
  item,
  type,
  isRenaming,
  newName,
  setNewName,
  onRename,
  onSave,
  onDelete,
  onCancelRename,
  viewMode,
}) => {
  const BASE_URL = "http://localhost:4000";

  // --- Utility for displaying file size
  const renderFileSize = (size) => {
    if (!size) return "";
    if (size > 1048576) return `${(size / 1048576).toFixed(1)} MB`;
    if (size > 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${size} B`;
  };

  // --- Modern Card Style for Grid View
  if (viewMode === "grid") {
    return (
      <div className="group relative bg-white rounded-2xl border border-gray-100 hover:shadow-2xl p-4 transition-all transform hover:-translate-y-1 duration-150 flex flex-col items-center">
        {/* Icon */}
        <div className="mb-3 flex justify-center w-full">
          {type === "folder" ? (
            <span className="inline-flex justify-center items-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-300 group-hover:from-blue-200">
              <Folder className="w-8 h-8 text-blue-600 group-hover:text-blue-700" />
            </span>
          ) : (
            <span className="inline-flex justify-center items-center w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-green-300 group-hover:from-green-200">
              <File className="w-8 h-8 text-green-600 group-hover:text-green-700" />
            </span>
          )}
        </div>

        {/* Name/edit input */}
        <div className="text-center w-full">
          {isRenaming ? (
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-full">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-sm text-gray-900 border border-blue-400 bg-blue-50 rounded-md px-3 py-2 pr-8 outline-none focus:ring-2 focus:ring-blue-400 transition"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSave();
                    if (e.key === "Escape") onCancelRename();
                  }}
                />
                <div className="absolute right-2 top-2 flex items-center gap-1">
                  <button
                    onClick={onSave}
                    className="text-green-600 hover:text-green-800"
                    title="Save"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onCancelRename}
                    className="text-gray-500 hover:text-gray-700"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p
                className="font-medium text-sm text-gray-900 truncate mb-1"
                title={item.name}
              >
                {item.name}
              </p>
              {type === "file" && item.size && (
                <div className="text-xs text-gray-400">
                  {renderFileSize(item.size)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Overlay actions, only visible on hover */}
        {!isRenaming && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
            {type === "folder" ? (
              <Link
                to={`/directory/${item.id}`}
                className="p-1 bg-white rounded-full shadow hover:bg-blue-50 text-blue-600"
                title="Open"
              >
                <Folder className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to={`${BASE_URL}/file/${item.id}`}
                  className="p-1 bg-white rounded-full shadow hover:bg-blue-50 text-blue-600"
                  title="Open"
                >
                  <File className="w-4 h-4" />
                </Link>
                <a
                  href={`${BASE_URL}/file/${item.id}?action=download`}
                  className="p-1 bg-white rounded-full shadow hover:bg-green-50 text-green-600"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
              </>
            )}
            <button
              onClick={onRename}
              className="p-1 bg-white rounded-full shadow hover:bg-yellow-50 text-yellow-600"
              title="Rename"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 bg-white rounded-full shadow hover:bg-red-50 text-red-600"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- Minimal & Clean List View
  return (
    <div className="bg-white border-b border-gray-100 hover:bg-gray-50 rounded-xl px-4 py-2 flex items-center justify-between shadow-sm transition">
      <div className="flex items-center space-x-3 flex-1">
        {type === "folder" ? (
          <Folder className="w-5 h-5 text-blue-500" />
        ) : (
          <File className="w-5 h-5 text-green-500" />
        )}
        {isRenaming ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-blue-400 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none w-full max-w-xs"
              autoFocus
              placeholder="Enter new name"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSave();
                if (e.key === "Escape") onCancelRename();
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={onSave}
                className="p-1.5 rounded-full hover:bg-green-100 text-green-600 transition"
                title="Save"
              >
                Save
              </button>
              <button
                onClick={onCancelRename}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition"
                title="Cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <span className="text-gray-900 flex-1 truncate">{item.name}</span>
        )}
      </div>
      {!isRenaming && (
        <div className="flex items-center gap-2">
          {type === "folder" ? (
            <Link
              to={`/directory/${item.id}`}
              className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded text-sm"
              title="Open"
            >
              Open
            </Link>
          ) : (
            <>
              <Link
                to={`${BASE_URL}/file/${item.id}`}
                className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded text-sm"
              >
                Open
              </Link>
              <a
                href={`${BASE_URL}/file/${item.id}?action=download`}
                className="text-green-600 hover:text-green-800 px-2 py-1 rounded text-sm"
              >
                Download
              </a>
            </>
          )}
          <button
            onClick={onRename}
            className="text-yellow-600 hover:text-yellow-800 px-2 py-1 rounded text-sm"
            title="Rename"
          >
            Rename
          </button>
          <button
            onClick={onDelete}
            className="text-red-600 hover:text-red-800 px-2 py-1 rounded text-sm"
            title="Delete"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

// Main Directory View Component
const DirectoryView = () => {
  const BASE_URL = "http://localhost:4000";
  const { dirId } = useParams();
  const [directoriesList, setDirectoriesList] = useState([]);
  const [filesList, setFilesList] = useState([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [renamingFile, setRenamingFile] = useState(null);
  const [newFilename, setNewFilename] = useState("");
  const [directoryname, setDirectoryname] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  async function getDirectoryItems() {
    try {
      const response = await fetch(`${BASE_URL}/directory/${dirId || ""}`, {
        credentials: "include",
      });
      if (response.status === 401) {
        navigate("/login");
        return;
      }
      if (response.status === 403) {
        navigate("/unauthorized");
        return;
      }
      if (response.status === 400) {
        const errorData = await response.json();
        setError(errorData.error || "Bad request.");
        return;
      }
      const data = await response.json();

      setDirectoriesList(data.directories);
      setFilesList(data.files);
    } catch (error) {
      console.error("Error fetching directory items:", error);
    }
  }

  useEffect(() => {
    getDirectoryItems();
  }, [dirId]);

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  async function uploadFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/file/${dirId || ""}`, true);
    xhr.setRequestHeader("filename", `${file.name}`);
    xhr.withCredentials = true;
    xhr.addEventListener("load", () => {
      setTimeout(() => {
        getDirectoryItems();
        setProgress(0);
        inputRef.current.value = "";
      }, 500);
    });

    xhr.upload.addEventListener("progress", (e) => {
      const totalProgress = (e.loaded / e.total) * 100;
      setProgress(totalProgress.toFixed(2));
    });

    xhr.send(file);
  }

  async function handleFileDelete(fileId) {
    try {
      const response = await fetch(`${BASE_URL}/file/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });
      await response.text();
      getDirectoryItems();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }

  async function handleDirectoryDelete(directoryId) {
    try {
      const response = await fetch(`${BASE_URL}/directory/${directoryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      await response.json();
      getDirectoryItems();
    } catch (error) {
      console.error("Error deleting directory:", error);
    }
  }

  function renameFile(oldFilename) {
    setRenamingFile(oldFilename);
    setNewFilename(oldFilename);
  }

  async function saveFile(fileId) {
    try {
      const response = await fetch(`${BASE_URL}/file/${fileId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newFilename,
        }),
        credentials: "include",
      });

      await response.json();
      setRenamingFile(null);
      setNewFilename("");
      getDirectoryItems();
    } catch (error) {
      console.error("Error renaming file:", error);
    }
  }

  async function saveDirectory(directoryId) {
    try {
      const response = await fetch(`${BASE_URL}/directory/${directoryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newDirname: newFilename,
        }),
      });

      await response.text();
      setRenamingFile(null);
      setNewFilename("");
      getDirectoryItems();
    } catch (error) {
      console.error("Error renaming directory:", error);
    }
  }

  async function handleCreateDirectory() {
    if (!directoryname.trim()) return;

    try {
      const response = await fetch(`${BASE_URL}/directory/${dirId || ""}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dirname: directoryname,
        }),
        credentials: "include",
      });

      await response.json();
      setDirectoryname("");
      setIsCreatingFolder(false);
      getDirectoryItems();
    } catch (error) {
      console.error("Error creating directory:", error);
    }
  }

  const cancelRename = () => {
    setRenamingFile(null);
    setNewFilename("");
  };

  if (error) {
    return (
      <div className="mx-auto my-8 max-w-md rounded-lg border-l-4 border-red-500 bg-red-100 px-6 py-4 shadow-lg flex items-center space-x-3">
        <svg
          className="w-6 h-6 text-red-500 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z"
          />
        </svg>
        <div>
          <h3 className="font-semibold text-red-700">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <Toolbar
        onUploadClick={handleUploadClick}
        viewMode={viewMode}
        setViewMode={setViewMode}
        uploadProgress={progress}
        isCreatingFolder={isCreatingFolder}
        setIsCreatingFolder={setIsCreatingFolder}
        newFolderName={directoryname}
        setNewFolderName={setDirectoryname}
        handleCreateDirectory={handleCreateDirectory}
      />

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        onChange={uploadFile}
        className="hidden"
        multiple
      />

      {/* Content Area */}
      <div className="px-6 py-6">
        {directoriesList.length === 0 && filesList.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Folder className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              This folder is empty
            </h3>
            <p className="text-gray-600">
              Upload files or create folders to get started
            </p>
          </div>
        ) : (
          <>
            {/* Directories */}
            {directoriesList.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Folders
                </h2>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
                      : "space-y-1"
                  }
                >
                  {directoriesList.map((directory) => (
                    <DriveItem
                      key={directory.id}
                      item={directory}
                      type="folder"
                      isRenaming={renamingFile === directory.name}
                      newName={newFilename}
                      setNewName={setNewFilename}
                      onRename={() => renameFile(directory.name)}
                      onSave={() => saveDirectory(directory.id)}
                      onDelete={() => handleDirectoryDelete(directory.id)}
                      onCancelRename={cancelRename}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {filesList.length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Files
                </h2>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
                      : "space-y-1"
                  }
                >
                  {filesList.map((file) => (
                    <DriveItem
                      key={file.id}
                      item={file}
                      type="file"
                      isRenaming={renamingFile === file.name}
                      newName={newFilename}
                      setNewName={setNewFilename}
                      onRename={() => renameFile(file.name)}
                      onSave={() => saveFile(file.id)}
                      onDelete={() => handleFileDelete(file.id)}
                      onCancelRename={cancelRename}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DirectoryView;
