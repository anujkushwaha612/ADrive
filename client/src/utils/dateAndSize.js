// Helper: Format Date
export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Helper: Format Size
export const renderFileSize = (size) => {
  if (!size) return "0 B";
  if (size > 1073741824) return `${(size / 1073741824).toFixed(2)} GB`;
  if (size > 1048576) return `${(size / 1048576).toFixed(1)} MB`;
  if (size > 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
};