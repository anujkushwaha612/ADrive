import React from 'react';
import { Upload, FolderPlus, Grid, List, Check, X, Loader2 } from 'lucide-react';

const Toolbar = ({
  onUploadClick,
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
    // Added sticky positioning and backdrop blur for a modern feel
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left Side: Actions */}
        <div className="flex items-center space-x-3">
          {/* Primary Action */}
          <button
            onClick={onUploadClick}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center space-x-2 font-medium text-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </button>

          {/* Secondary Action */}
          <button
            onClick={() => setIsCreatingFolder(true)}
            disabled={isCreatingFolder}
            className={`px-4 py-2.5 rounded-lg border flex items-center space-x-2 text-sm font-medium transition-all duration-200 
              ${isCreatingFolder 
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Folder</span>
          </button>

          {/* Upload Progress (only visible when active) */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="hidden md:flex flex-col min-w-[140px] animate-in fade-in duration-300">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: View Toggles */}
        <div className="flex items-center">
          {/* Segmented Control styling */}
          <div className="bg-gray-100 p-1 rounded-lg flex items-center border border-gray-200">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === "grid"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === "list"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Folder Creation Area - Collapsible Panel */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isCreatingFolder ? 'max-h-20 opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex items-center space-x-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100 border-dashed">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <FolderPlus className="w-5 h-5" />
            </div>
            
            <input
              type="text"
              placeholder="Enter folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="flex-1 bg-white border border-blue-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              autoFocus={isCreatingFolder}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateDirectory()}
            />
            
            <div className="flex items-center space-x-1">
              <button
                onClick={handleCreateDirectory}
                disabled={!newFolderName.trim()}
                className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Create"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName("");
                }}
                className="p-2 bg-white text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50 hover:text-gray-700 transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;