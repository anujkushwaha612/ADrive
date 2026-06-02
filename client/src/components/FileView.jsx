import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Download,
  FileText,
  Image as ImageIcon,
  Info,
  MessageSquare,
  MoreVertical,
  Printer,
  Share2,
  ZoomIn,
  ZoomOut,
  Video,
} from "lucide-react";

const IMAGE_EXTENSIONS = [
  "jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "avif", "heic", "heif",
];

const VIDEO_EXTENSIONS = [
  "mp4", "webm", "ogg", "mov", "mkv", "avi", "m4v"
];

function getViewerType(extension = "") {
  const ext = extension.toLowerCase().replace(/^\./, "");
  if (ext === "pdf") return "pdf";
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (VIDEO_EXTENSIONS.includes(ext)) return "video";
  return "other";
}

function buildPdfSrc(url = "") {
  if (!url) return "";
  return `${url}${url.includes("#") ? "&" : "#"}toolbar=0&navpanes=0&scrollbar=0`;
}

function ToolbarIconButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-200 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

export default function FileViewerOverlay({
  fileId,
  fileName = "",
  onClose,
}) {
  const BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  const [name, setName] = useState(fileName || "Untitled file");
  const [extension, setExtension] = useState("");
  const [cloudFrontUrl, setCloudFrontUrl] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(100);

  const viewerType = useMemo(() => getViewerType(extension), [extension]);
  
  // Determine which icon to show based on the file type
  const CurrentFileIcon = useMemo(() => {
    if (viewerType === "image") return ImageIcon;
    if (viewerType === "video") return Video;
    return FileText;
  }, [viewerType]);

  // Lock body scroll & enable Escape to close
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Fetch file data from backend (the single source of truth)
  useEffect(() => {
    let ignore = false;

    const fetchFileData = async () => {
      if (!fileId) {
        setIsLoading(false);
        setError("No file ID provided.");
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(`${BASE_URL}/file/${fileId}`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch file data");
        const data = await response.json();

        if (ignore) return;

        setName(data.name || data.fileName || fileName || "Untitled file");
        setExtension(data.extension || "");
        setCloudFrontUrl(data.cloudFrontUrl || "");
        setFileSize(data.size || 0);
      } catch (err) {
        if (!ignore) {
          console.error("Failed to fetch file data:", err);
          setError("Unable to load this file preview.");
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchFileData();
    return () => { ignore = true; };
  }, [fileId, fileName, BASE_URL]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));

  const handleShare = async () => {
    if (!cloudFrontUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url: cloudFrontUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(cloudFrontUrl);
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  const handleDownload = async () => {
    if (!cloudFrontUrl) return;

    const downloadName = name || `download${extension ? `${extension}` : ""}`;
    const SIZE_THRESHOLD = 100 * 1024 * 1024; // 100 MB

    // For large files (>100MB), let the browser handle streaming to disk directly
    if (fileSize > SIZE_THRESHOLD) {
      const link = document.createElement("a");
      link.href = cloudFrontUrl;
      link.download = downloadName;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // For standard files (≤100MB), use secure Blob method
    try {
      setIsDownloading(true);
      const response = await fetch(cloudFrontUrl);
      if (!response.ok) throw new Error(`Download failed (${response.status})`);

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!cloudFrontUrl) return;

    if (viewerType === "image") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      printWindow.document.write(`
        <html>
          <head>
            <title>${name}</title>
            <style>
              body {
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: #111;
              }
              img {
                max-width: 100%;
                max-height: 100vh;
                object-fit: contain;
              }
            </style>
          </head>
          <body>
            <img src="${cloudFrontUrl}" onload="window.focus(); window.print();" />
          </body>
        </html>
      `);
      printWindow.document.close();
      return;
    }

    // For non-images (PDFs, videos), open in a new tab where the browser's native print can take over if applicable
    const printWindow = window.open(cloudFrontUrl, "_blank");
    if (printWindow) printWindow.focus();
  };

  const renderViewer = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-5 py-4 text-sm text-gray-200">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          Loading preview...
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-center text-gray-200 shadow-xl">
          <p className="text-base font-medium">{error}</p>
          <p className="mt-2 text-sm text-gray-400">
            Please try again or open the file directly.
          </p>
        </div>
      );
    }

    if (!cloudFrontUrl) {
      return (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-center text-gray-200 shadow-xl">
          <p className="text-base font-medium">No file available</p>
        </div>
      );
    }

    if (viewerType === "image") {
      return (
        <div
          className="transition-transform duration-200 ease-out"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <img
            src={cloudFrontUrl}
            alt={name}
            draggable={false}
            className="max-h-[calc(100vh-8rem)] max-w-[92vw] object-contain select-none drop-shadow-2xl"
          />
        </div>
      );
    }

    if (viewerType === "video") {
      return (
        <div
          className="transition-transform duration-200 ease-out flex items-center justify-center w-full h-full"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <video
            src={cloudFrontUrl}
            controls
            autoPlay
            className="max-h-[calc(100vh-8rem)] max-w-[92vw] rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.6)] bg-black"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (viewerType === "pdf") {
      return (
        <div
          className="transition-transform duration-200 ease-out"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <div className="w-[min(92vw,960px)] overflow-hidden rounded-md bg-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] ring-1 ring-black/10">
            <iframe
              src={buildPdfSrc(cloudFrontUrl)}
              title={name}
              className="h-[calc(100vh-8rem)] min-h-[500px] w-full bg-white"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-center text-gray-200 shadow-xl">
        <p className="text-base font-medium">Preview not available for this file type.</p>
        <a
          href={cloudFrontUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          Open file
        </a>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 text-white backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
    >
      <header className="fixed inset-x-0 top-0 z-10 border-b border-white/10 bg-gray-900/90 backdrop-blur-md">
        <div className="flex h-16 items-center gap-4 px-3 md:px-6">
          {/* Left */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <ToolbarIconButton icon={ArrowLeft} label="Close viewer" onClick={onClose} />

            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <CurrentFileIcon className="h-5 w-5 text-white" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{name}</p>
                <p className="hidden text-xs text-gray-400 sm:block">
                  {viewerType === "pdf"
                    ? "PDF preview"
                    : viewerType === "image"
                    ? "Image preview"
                    : viewerType === "video"
                    ? "Video preview"
                    : "File preview"}
                </p>
              </div>
            </div>
          </div>

          {/* Middle */}
          <div className="hidden flex-1 items-center justify-center gap-2 md:flex">
            <div className="flex items-center rounded-full bg-white/5 px-1">
              <ToolbarIconButton
                icon={ZoomOut}
                label="Zoom out"
                onClick={handleZoomOut}
                disabled={isLoading}
              />
              <span className="min-w-[4rem] text-center text-sm font-medium text-gray-200">
                {zoom}%
              </span>
              <ToolbarIconButton
                icon={ZoomIn}
                label="Zoom in"
                onClick={handleZoomIn}
                disabled={isLoading}
              />
            </div>

            <ToolbarIconButton
              icon={MessageSquare}
              label="Comments"
              onClick={() => {}}
              disabled={isLoading}
            />
            <ToolbarIconButton
              icon={Info}
              label="File details"
              onClick={() => {}}
              disabled={isLoading}
            />
          </div>

          {/* Right */}
          <div className="flex flex-1 items-center justify-end gap-1">
            <button
              type="button"
              onClick={handleShare}
              disabled={!cloudFrontUrl || isLoading}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <ToolbarIconButton
              icon={Download}
              label={isDownloading ? "Downloading..." : "Download"}
              onClick={handleDownload}
              disabled={!cloudFrontUrl || isLoading || isDownloading}
            />
            <ToolbarIconButton
              icon={Printer}
              label="Print"
              onClick={handlePrint}
              disabled={!cloudFrontUrl || isLoading || viewerType === "video"}
              className="hidden sm:inline-flex"
            />
            <ToolbarIconButton
              icon={MoreVertical}
              label="More options"
              onClick={() => {}}
              disabled={isLoading}
            />
          </div>
        </div>
      </header>

      <main className="h-screen overflow-auto pt-16">
        <div className="flex min-h-full min-w-full items-center justify-center p-4 md:p-8">
          {renderViewer()}
        </div>
      </main>
    </div>
  );
}