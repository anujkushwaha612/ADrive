import React from 'react';
import { ChevronRight, Monitor } from 'lucide-react';

const Breadcrumbs = ({ path = [], onNavigate }) => {
  
  // If path is empty, we are at root. Render default My Drive.
  if (path.length === 0) {
    return (
      <nav className="flex items-center text-sm font-medium text-gray-600 overflow-x-auto no-scrollbar whitespace-nowrap px-4 py-2 border-b border-gray-200 bg-white">
        <button
          disabled
          className="flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-900 font-bold cursor-default"
        >
          <Monitor className="w-4 h-4 mr-2" />
          <span>My Drive</span>
        </button>
      </nav>
    );
  }

  return (
    <nav className="flex items-center text-sm font-medium text-gray-600 overflow-x-auto no-scrollbar whitespace-nowrap px-4 py-2 border-b border-gray-200 bg-white">
      {path.map((folder, index) => {
        const isLast = index === path.length - 1;

        // --- 1. SPECIAL CASE: Index 0 is always "My Drive" ---
        if (index === 0) {
          return (
            <button
              key={folder._id || folder.id}
              // If it's the only item (isLast), we are at root -> Disabled
              // If it's NOT the last item, clicking it goes to Root (null)
              onClick={() => !isLast && onNavigate(null)} 
              disabled={isLast}
              className={`flex items-center px-2 py-1 rounded-md transition-colors
                ${isLast 
                  ? "bg-gray-100 text-gray-900 font-bold cursor-default" // Active (Bold)
                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-900" // Clickable (Gray)
                }`}
            >
              <Monitor className="w-4 h-4 mr-2" />
              <span>My Drive</span>
            </button>
          );
        }

        // --- 2. STANDARD CASE: All other folders (Index > 0) ---
        return (
          <div key={folder._id || folder.id} className="flex items-center">
            {/* Separator */}
            <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />

            {/* Folder Name */}
            <button
              onClick={() => !isLast && onNavigate(folder._id || folder.id)}
              disabled={isLast}
              className={`px-2 py-1 rounded-md transition-colors max-w-[150px] truncate
                ${isLast
                  ? "font-bold text-gray-900 cursor-default bg-gray-50" // Active
                  : "hover:bg-gray-100 text-gray-500 hover:text-gray-900" // Clickable
                }`}
              title={folder.name}
            >
              {folder.name}
            </button>
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;