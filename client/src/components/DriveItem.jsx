import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Folder,
  File,
  MoreVertical,
  Edit2,
  Trash2,
  Download,
  Info,
  X,
  Check,
  ExternalLink,
  Clock,
  Calendar,
} from "lucide-react";
import { formatDate, renderFileSize } from "../utils/dateAndSize.js";

const DriveItem = ({
  item,
  type, // "folder" | "file"
  onRename, // callback to save rename
  onDelete,
  viewMode, // "grid" | "list"
}) => {
  const BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [localName, setLocalName] = useState(item.name);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowDetails(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDetails]);

  const handleMenuAction = (action) => {
    setShowMenu(false);
    action();
  };

  const startRename = () => {
    setIsRenaming(true);
    setLocalName(item.name);
  };

  const saveRename = async () => {
    if (localName.trim() && localName !== item.name) {
      await onRename(item.id, localName);
    }
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setLocalName(item.name);
  };

  // Handle input change while preserving cursor position
  const handleInputChange = (e) => {
    const cursorPosition = e.target.selectionStart;
    const value = e.target.value;
    setLocalName(value);
    
    // Restore cursor position after state update
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  };

  // --- RENDER: Details Modal ---
  const DetailsModal = () => {
    if (!showDetails) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div
          ref={menuRef}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-700">Item Details</h3>
            <button
              onClick={() => setShowDetails(false)}
              className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center mb-4">
              <div
                className={`p-4 rounded-2xl mb-3 ${
                  type === "folder"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {type === "folder" ? (
                  <Folder className="w-10 h-10" />
                ) : (
                  <File className="w-10 h-10" />
                )}
              </div>
              <p className="text-lg font-medium text-center text-gray-900 break-all">
                {item.name}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <File className="w-4 h-4" /> Type
                </span>
                <span className="font-medium text-gray-800">
                  {type === "folder" ? "Folder" : "File"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Size
                </span>
                <span className="font-medium text-gray-800">
                  {renderFileSize(item.size)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Created
                </span>
                <span className="font-medium text-gray-800">
                  {formatDate(item.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Modified
                </span>
                <span className="font-medium text-gray-800">
                  {formatDate(item.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER: Kebab Menu (Dropdown) ---
  const KebabMenu = () => (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setShowMenu((prev) => !prev);
        }}
        className={`p-1.5 rounded-full transition-colors ${
          viewMode === "grid"
            ? "hover:bg-white/80 text-gray-500 hover:text-gray-900"
            : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
        }`}
      >
        <MoreVertical className="w-5 h-5 pointer-events-none" />
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 origin-top-right">
          <div className="py-1">
            {/* Open Action */}
            {type === "folder" ? (
              <Link
                to={`/directory/${item.id}`}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <ExternalLink className="w-4 h-4 mr-2" /> Open
              </Link>
            ) : (
              <Link
                to={`${BASE_URL}/file/${item.id}`}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <ExternalLink className="w-4 h-4 mr-2" /> Open
              </Link>
            )}

            {/* Download (Files only) */}
            {type === "file" && (
              <a
                href={`${BASE_URL}/file/${item.id}?action=download`}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" /> Download
              </a>
            )}

            <button
              onClick={() => handleMenuAction(startRename)}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Edit2 className="w-4 h-4 mr-2" /> Rename
            </button>

            <button
              onClick={() => handleMenuAction(() => setShowDetails(true))}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Info className="w-4 h-4 mr-2" /> Details
            </button>

            <div className="border-t border-gray-100 my-1"></div>

            <button
              onClick={() => handleMenuAction(() => onDelete(item.id))}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // --- RENDER: Rename Input (Shared) ---
  const RenameInput = () => (
    <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="text"
        value={localName}
        onChange={handleInputChange}
        className="w-full text-sm text-gray-900 border border-blue-400 bg-blue-50 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-400"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") saveRename();
          if (e.key === "Escape") cancelRename();
        }}
      />
      <button
        onClick={saveRename}
        className="p-1 text-green-600 hover:bg-green-100 rounded flex-shrink-0"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={cancelRename}
        className="p-1 text-red-500 hover:bg-red-100 rounded flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  // --- VIEW: Grid Mode ---
  if (viewMode === "grid") {
    return (
      <>
        <div className="group relative bg-white rounded-2xl border border-gray-100 hover:shadow-xl p-4 transition-all duration-200 flex flex-col items-center h-full">
          {/* Top Right Menu */}
          {!isRenaming && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <KebabMenu />
            </div>
          )}

          {/* Icon Area */}
          <div className="mb-4 flex-1 flex items-center justify-center w-full">
            {!isRenaming && (
              <Link
                to={
                  type === "folder"
                    ? `/directory/${item.id}`
                    : `${BASE_URL}/file/${item.id}`
                }
                className="cursor-pointer"
              >
                {type === "folder" ? (
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Folder className="w-8 h-8 text-blue-500" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <File className="w-8 h-8 text-green-500" />
                  </div>
                )}
              </Link>
            )}
            {isRenaming && (
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                {type === "folder" ? (
                  <Folder className="w-8 h-8 text-blue-500" />
                ) : (
                  <File className="w-8 h-8 text-green-500" />
                )}
              </div>
            )}
          </div>

          {/* Name / Rename Area */}
          <div className="w-full text-center h-12 flex items-start justify-center">
            {isRenaming ? (
              <RenameInput />
            ) : (
              <div className="w-full">
                <p
                  className="font-medium text-sm text-gray-700 truncate px-2"
                  title={`Size: ${renderFileSize(item.size)}\nCreated On: ${item.createdAt}`}
                >
                  {item.name}
                </p>
                {type === "file" && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {renderFileSize(item.size)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        <DetailsModal />
      </>
    );
  }

  // --- VIEW: List Mode ---
  return (
    <>
      <div className="bg-white border-b border-gray-100 hover:bg-gray-50 last:border-0 px-4 py-3 flex items-center justify-between transition-colors group">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Icon */}
          <div
            className={`p-2 rounded-lg ${
              type === "folder" ? "bg-blue-50" : "bg-green-50"
            }`}
          >
            {type === "folder" ? (
              <Folder className="w-5 h-5 text-blue-500" />
            ) : (
              <File className="w-5 h-5 text-green-500" />
            )}
          </div>

          {/* Name or Rename Input */}
          {isRenaming ? (
            <div className="max-w-md flex-1">
              <RenameInput />
            </div>
          ) : (
            <div className="flex-1 min-w-0 grid grid-cols-12 items-center gap-4">
              {/* Name Column */}
              <div className="col-span-6 sm:col-span-8">
                <Link
                  to={
                    type === "folder"
                      ? `/directory/${item.id}`
                      : `${BASE_URL}/file/${item.id}`
                  }
                  className="font-medium text-gray-700 truncate hover:text-blue-600 block"
                  title={`Size: ${renderFileSize(item.size)}\nCreated On: ${formatDate(item.createdAt)}`}
                >
                  {item.name}
                </Link>
              </div>

              {/* Metadata Columns (Hidden on small screens) */}
              <div className="hidden sm:block col-span-2 text-xs text-gray-400 truncate">
                {renderFileSize(item.size)}
              </div>
              <div className="hidden sm:block col-span-2 text-xs text-gray-400 truncate">
                {formatDate(item.createdAt)}
              </div>
            </div>
          )}
        </div>

        {/* Action Menu */}
        {!isRenaming && (
          <div className="ml-4 flex-shrink-0">
            <KebabMenu />
          </div>
        )}
      </div>
      <DetailsModal />
    </>
  );
};

export default DriveItem;