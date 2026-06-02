import { useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Folder } from "lucide-react";
import Header from "./components/Header";
import DriveItem from "./components/DriveItem";
import Toolbar from "./components/Toolbar";
import { toast } from "sonner";
import {
  ErrorToast,
  LoadingToast,
  SuccessToast,
} from "./components/ToastComponents";
import Breadcrumbs from "./components/Breadcrumbs";
import FileViewerOverlay from "./components/FileView";

// Main Directory View Component
const DirectoryView = () => {
  const BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
  const { dirId } = useParams();
  const [directoriesList, setDirectoriesList] = useState([]);
  const [filesList, setFilesList] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [directoryname, setDirectoryname] = useState("");
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const handleOpenViewer = (item) => {
    setSelectedFileId(item.id);
    setSelectedFileName(item.name || "");
    setIsViewerOpen(true);
  };

  const handleNavigate = (folderId) => {
    if (!folderId) {
      navigate("/"); // Go to Root
    } else {
      navigate(`/directory/${folderId}`);
    }
  };

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

      if (!dirId) {
        setCurrentPath([]);
      } else if (data.path) {
        setCurrentPath(data.path);
      }
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

    let toastId;
    try {
        // 1. Initialize the upload and get the POST policy from your backend
        const initResponse = await fetch(`${BASE_URL}/file/init-upload/${dirId || ""}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                filename: file.name,
                filesize: file.size,
                contentType: file.type || "application/octet-stream"
            })
        });

        if (!initResponse.ok) {
            const errorData = await initResponse.json();
            toast.custom((t) => (
                <ErrorToast
                    t={t}
                    title="Permission Denied"
                    message={errorData.error || "Upload denied"}
                />
            ));
            // Reset input so user can try again
            if (inputRef.current) inputRef.current.value = "";
            return;
        }

        // 2. Extract the new uploadFields alongside the URL and ID
        const { uploadUrl, uploadFields, fileId } = await initResponse.json();
        
        toastId = toast.custom(
            () => (
                <LoadingToast
                    message="Uploading File"
                    subMessage={`Sending ${file.name}...`}
                />
            ),
            { duration: Infinity }
        );

        // 3. Configure the XHR request for POST
        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadUrl, true);
        
        // CRITICAL: Do NOT set "Content-Type" manually when sending FormData.
        // The browser will automatically set it to 'multipart/form-data' with the correct boundary.
        xhr.withCredentials = false;

        // 4. Track Progress
        xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
                const totalProgress = (e.loaded / e.total) * 100;
                setProgress(totalProgress.toFixed(2));
            }
        });

        // 5. Handle Upload Completion
        xhr.addEventListener("load", () => {
            toast.dismiss(toastId);
            
            if (xhr.status >= 200 && xhr.status < 300) {
                toast.custom((t) => (
                    <SuccessToast
                        t={t}
                        title="Upload Complete"
                        message={`${file.name} has been safely stored.`}
                    />
                ));

                // Notify backend that AWS has the file safely
                fetch(`${BASE_URL}/file/status/${fileId}`, {
                    method: "PATCH",
                    credentials: "include"
                }).catch(err => console.error("Failed to update DB status", err));

                getDirectoryItems();
            } else {
                // AWS rejected the file (e.g., size exceeded the POST policy limits)
                toast.custom((t) => (
                    <ErrorToast
                        t={t}
                        title="Upload Failed"
                        message="Server rejected the file. It may be too large or an invalid format."
                    />
                ));

                fetch(`${BASE_URL}/file/${fileId}`, {
                    method: "DELETE",
                    credentials: "include"
                }).catch(err => console.error("Failed to delete file record", err));
            }

            setTimeout(() => {
                setProgress(0);
                if (inputRef.current) {
                    inputRef.current.value = "";
                }
            }, 300);
        });

        // Handle severe network errors (e.g., wifi drops)
        xhr.addEventListener("error", () => {
            toast.dismiss(toastId);
            toast.custom((t) => (
                <ErrorToast t={t} title="Network Error" message="Upload interrupted. Please check your connection." />
            ));
            setProgress(0);
            if (inputRef.current) inputRef.current.value = "";
        });

        // 6. Construct the Secure Payload
        const formData = new FormData();
        
        // Append all AWS signature/policy fields FIRST
        if (uploadFields) {
            Object.entries(uploadFields).forEach(([key, value]) => {
                formData.append(key, value);
            });
        }
        
        // Append the actual file LAST (AWS will reject if this is not the last field)
        formData.append("file", file);

        // 7. Send the FormData
        xhr.send(formData);

    } catch (error) {
        console.error("Upload process failed:", error);
        if (toastId) toast.dismiss(toastId);
        
        toast.custom((t) => (
            <ErrorToast t={t} title="System Error" message="An unexpected error occurred during upload." />
        ));
        
        setProgress(0);
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

  async function saveFile(fileId, newFilename) {
    try {
      const response = await fetch(`${BASE_URL}/file/rename/${fileId}`, {
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
      getDirectoryItems();
    } catch (error) {
      console.error("Error renaming file:", error);
    }
  }

  async function saveDirectory(directoryId, newDirName) {
    try {
      const response = await fetch(`${BASE_URL}/directory/${directoryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newDirName,
        }),
        credentials: "include",
      });
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
      <Header user={user} setUser={setUser} />

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

      <div className="sticky top-16 z-30">
        <Breadcrumbs path={currentPath} onNavigate={handleNavigate} />
      </div>

      <input
        ref={inputRef}
        type="file"
        onChange={uploadFile}
        className="hidden"
      />

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
                      user={user}
                      onRename={saveDirectory}
                      onDelete={handleDirectoryDelete}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </div>
            )}

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
                      user={user}
                      onRename={saveFile}
                      onDelete={handleFileDelete}
                      onOpen={handleOpenViewer}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isViewerOpen && (
        <FileViewerOverlay
          fileId={selectedFileId}
          fileName={selectedFileName}
          onClose={() => {
            setIsViewerOpen(false);
            setSelectedFileId(null);
            setSelectedFileName("");
          }}
        />
      )}
    </div>
  );
};

export default DirectoryView;
