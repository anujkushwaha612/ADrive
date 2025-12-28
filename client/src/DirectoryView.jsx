import { useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Folder } from "lucide-react";
import Header from "./components/Header";
import DriveItem from "./components/DriveItem";
import Toolbar from "./components/Toolbar";
import { toast } from "sonner";
import { ErrorToast, LoadingToast, SuccessToast } from "./components/ToastComponents";

// Main Directory View Component
const DirectoryView = () => {
  const BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
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

    let toastId; // We need this ID to dismiss the loading toast later

    try {
        // --- STEP 1: Handshake ---
        const initResponse = await fetch(`${BASE_URL}/file/init-upload`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ filename: file.name, filesize: file.size }),
        });

        if (!initResponse.ok) {
            const errorData = await initResponse.json();
            // Show Custom Error
            toast.custom((t) => (
                <ErrorToast t={t} title="Permission Denied" message={errorData.error || "Upload denied"} />
            ));
            return;
        }

        const { uploadToken } = await initResponse.json();

        // --- START LOADING TOAST ---
        // We save the ID so we can dismiss strictly this toast later
        toastId = toast.custom(() => (
            <LoadingToast message="Uploading File" subMessage={`Sending ${file.name}...`} />
        ), { duration: Infinity }); // Keep open until we manually dismiss

        // --- STEP 2: Actual Upload ---
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${BASE_URL}/file/${dirId || ""}`, true);
        xhr.setRequestHeader("x-upload-token", uploadToken);
        xhr.setRequestHeader("filename", file.name);
        xhr.setRequestHeader("filesize", file.size);
        xhr.withCredentials = true;

        xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
                const totalProgress = (e.loaded / e.total) * 100;
                setProgress(totalProgress.toFixed(2));
            }
        });

        xhr.addEventListener("load", () => {
            toast.dismiss(toastId); // Remove Loading Toast

            if (xhr.status >= 200 && xhr.status < 300) {
                // ✅ Show Custom Success
                toast.custom((t) => (
                    <SuccessToast 
                        t={t} 
                        title="Upload Complete" 
                        message={`${file.name} has been safely stored.`} 
                    />
                ));
                getDirectoryItems();
            } else {
                // ❌ Show Custom Error (Backend)
                try {
                    const response = JSON.parse(xhr.responseText);
                    toast.custom((t) => (
                        <ErrorToast t={t} title="Upload Failed" message={response.message || "Server rejected the file."} />
                    ));
                } catch (e) {
                    toast.custom((t) => (
                        <ErrorToast t={t} title="Upload Failed" message="An unexpected error occurred." />
                    ));
                }
            }
            // Reset Progress Bar
            setTimeout(() => {
                setProgress(0);
                if (inputRef.current) inputRef.current.value = "";
            }, 500);
        });

        xhr.addEventListener("error", () => {
            toast.dismiss(toastId);
            // ❌ Show Custom Error (Network)
            toast.custom((t) => (
                <ErrorToast t={t} title="Network Error" message="Please check your internet connection." />
            ));
            setProgress(0);
        });

        xhr.send(file);

    } catch (error) {
        if (toastId) toast.dismiss(toastId);
        // ❌ Show Custom Error (Handshake/Catch)
        toast.custom((t) => (
            <ErrorToast t={t} title="Error" message={error.message} />
        ));
        if (inputRef.current) inputRef.current.value = "";
    }
}

  async function handleFileDelete(fileId) {
    try {
      const response = await fetch(`${BASE_URL}/file/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });
      await response.json();
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
          newDirName: newFilename,
        }),
        credentials: "include",
      });
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
                      onRename={() => {
                        setRenamingFile(directory.name);
                        setNewFilename(directory.name);
                      }}
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
