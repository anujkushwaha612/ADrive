import React, { useState, useEffect, useMemo } from "react";
import {
  Share2,
  Users,
  FolderOpen,
  File,
  MoreVertical,
  Download,
  ExternalLink,
  Clock,
  User,
} from "lucide-react";
import Header from "../components/Header";
import { renderFileSize } from "../utils/dateAndSize";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [user, setUser] = useState(null);
  const [sharedFilesWithMe, setSharedFilesWithMe] = useState([]);
  const [sharedFilesByMe, setSharedFilesByMe] = useState([]);

  
  // --- 1. Fetch Logic ---
  const fetchUser = async () => {
    try {
      const response = await fetch("http://localhost:4000/user", {
        credentials: "include",
      });
      if (response.status === 404) {
        setUser(null);
        // navigate("/login"); // Uncomment if using router
        return;
      }
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error("Auth fetch error:", error);
      setUser(null);
    }
  };

  const getSharedFilesWithMe = async () => {
    try {
      const response = await fetch(
        "http://localhost:4000/share/shared-with-me",
        { credentials: "include", method: "GET" }
      );
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      if (data.success) {
        setSharedFilesWithMe(data.sharedFilesWithMe || []); // Safety fallback
      }
    } catch (error) {
      console.error("Shared With Me Error:", error);
    }
  };

  const getSharedFilesByMe = async () => {
    try {
      const response = await fetch(
        "http://localhost:4000/share/shared-by-me",
        { credentials: "include", method: "GET" }
      );
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      if (data.success) {
        console.log(data.sharedByMe)
        setSharedFilesByMe(data.sharedByMe || []); // Note: matched your previous controller response structure
      }
    } catch (error) {
      console.error("Shared By Me Error:", error);
    }
  };

  useEffect(() => {
    fetchUser();
    getSharedFilesWithMe();
    getSharedFilesByMe();
  }, []);

  // --- 2. Filter & Combine Logic (The Fix) ---
  const displayedFiles = useMemo(() => {
    let files = [];
    
    if (activeTab === "shared-with-me") {
      files = sharedFilesWithMe;
    } else if (activeTab === "shared-by-me") {
      files = sharedFilesByMe;
    } else {
      // "all": Combine both arrays
      // We use a Set or just merge. Since IDs are unique, simple concat works.
      // We add a 'source' tag to help with rendering logic if needed
      const withMe = sharedFilesWithMe.map(f => ({ ...f, _source: 'with-me' }));
      const byMe = sharedFilesByMe.map(f => ({ ...f, _source: 'by-me' }));
      files = [...withMe, ...byMe];
    }

    // Sort by Date (Newest First)
    return files.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt);
      const dateB = new Date(b.updatedAt || b.createdAt);
      return dateB - dateA;
    });
  }, [activeTab, sharedFilesWithMe, sharedFilesByMe]);


  // --- 3. Helpers ---
  const getFileIcon = (type) => {
    const iconClass = "w-5 h-5";
    // Simple extension check or mime-type check
    if (type?.includes("pdf")) return <File className={`${iconClass} text-red-500`} />;
    if (type?.includes("image")) return <File className={`${iconClass} text-purple-500`} />;
    if (type?.includes("code") || type?.includes("javascript") || type?.includes("json")) return <File className={`${iconClass} text-green-500`} />;
    return <File className={`${iconClass} text-gray-500`} />;
  };

  const getOwnerName = (file) => {
    // If I am the logged-in user and I own the file
    return file.userId?.name || "Me";
  };

  const stats = [
    {
      label: "Shared With Me",
      value: sharedFilesWithMe.length,
      subtitle: "Files from others",
      icon: FolderOpen,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Shared By Me",
      value: sharedFilesByMe.length,
      subtitle: "Files you shared",
      icon: Share2,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Collaborators",
      value: "0",
      subtitle: "Active members",
      icon: Users,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} setUser={setUser} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            File Dashboard
          </h1>
          <p className="text-gray-600">
            Manage your shared files and collaborations
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{stat.label}</h3>
                <p className="text-sm text-gray-500">{stat.subtitle}</p>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            {["all", "shared-with-me", "shared-by-me"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 text-sm font-medium transition-colors relative ${
                  activeTab === tab
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === 'all' ? 'Recent Activity' : 
               activeTab === 'shared-with-me' ? 'Files Shared With Me' : 'Files Shared By Me'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Your latest shared files and collaborations
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {displayedFiles.length === 0 && (
              <p className="p-6 text-center text-gray-500">
                No files found for this category.
              </p>
            )}
            
            {displayedFiles.map((file) => (
              <div
                key={file._id || file.id} // Ensure Key is unique
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.type || file.extension)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {file.name || file.filename}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        {/* Owner Badge */}
                        <span className="text-xs text-gray-500 flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {getOwnerName(file)}
                        </span>
                        
                        <span className="text-xs text-gray-400">•</span>
                        
                        {/* Logic for showing Role vs Shared Count */}
                        <span className="text-xs text-gray-500">
                          {getOwnerName(file) === "Me" 
                            ? `Shared with ${file.sharedWith?.length || 0} people`
                            : file.sharedWith?.[0]?.role || "Viewer"}
                        </span>
                        
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {renderFileSize(file.size)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 ml-4">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {/* Handle different date formats */}
                      {new Date(file.updatedAt || file.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Open"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;