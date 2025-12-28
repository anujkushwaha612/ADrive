import React, { useState, useRef, useEffect } from "react";
import { 
  Search, 
  Settings, 
  User, 
  LogOut, 
  Smartphone, 
  LayoutDashboard, 
  ChevronDown,
  Cloud,        // New Icon
  HardDrive     // New Icon
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatDate, renderFileSize } from "../utils/dateAndSize.js";


// Helper hook stays the same
const useOutsideClick = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
};

const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Helper to determine color based on usage
  const getUsageColor = (pct) => {
    if (pct > 90) return "bg-red-500";
    if (pct > 70) return "bg-amber-500";
    return "bg-blue-600";
  };

  useOutsideClick(dropdownRef, () => {
    if (dropdownOpen) setDropdownOpen(false);
  });

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:4000/user/logout", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) navigate("/login");
    } catch (e) { console.error(e); }
    setDropdownOpen(false);
  };

  const handleLogoutFromAllDevices = async () => {
    try {
      const response = await fetch("http://localhost:4000/user/logout-all", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) navigate("/login");
    } catch (e) { console.error(e); }
    setDropdownOpen(false);
  };

  const fetchUser = async () => {
    try {
      const response = await fetch("http://localhost:4000/user", {
        credentials: "include",
      });
      if(response.status === 404){
        setUser(null);
        navigate("/login");
        return;
      }
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error("Auth fetch error:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand / Logo */}
        <div className="flex items-center min-w-fit">
           <div className="bg-blue-600 p-1.5 rounded-lg mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
           </div>
           <h1 className="text-xl font-bold text-gray-800 tracking-tight">My Drive</h1>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-2xl hidden sm:block">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search files, folders..."
              className="block w-full pl-10 pr-3 py-2.5 border-none rounded-xl bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:shadow-md transition-all duration-200 sm:text-sm"
            />
          </div>
        </div>

        {/* Right: User Profile */}
        <div className="flex items-center space-x-4" ref={dropdownRef}>
          <button className="sm:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <Search className="w-5 h-5" />
          </button>

          <div className="relative">
            {loading ? (
               <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center space-x-2 pl-1 pr-2 py-1 rounded-full transition-all duration-200 border 
                  ${dropdownOpen ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' : 'bg-white border-transparent hover:bg-gray-100'}`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                    {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
               <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-400" />
               </div>
            )}

            {/* Dropdown Menu */}
            {dropdownOpen && user && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 ring-1 ring-black ring-opacity-5 py-2 transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2">
                
                {/* User Info Header */}
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* --- STORAGE USAGE SECTION (NEW) --- */}
                <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Cloud className="w-4 h-4 text-gray-400" />
                            <span>Storage</span>
                        </div>
                        <span className={`text-xs font-semibold ${((user.storageUsed / user.maxStorage) * 100) > 90 ? 'text-red-600' : 'text-blue-600'}`}>
                            {((user.storageUsed / user.maxStorage) * 100).toFixed(0)}% used
                        </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ease-out ${getUsageColor((user.storageUsed / user.maxStorage) * 100)}`}
                            style={{ width: `${((user.storageUsed / user.maxStorage) * 100).toFixed(0)}%` }}
                        />
                    </div>
                    
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">
                            <span className="font-semibold text-gray-900">{renderFileSize(user.storageUsed)}</span> of {renderFileSize(user.maxStorage)}
                        </span>
                        <Link to="/settings" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
                            Upgrade
                        </Link>
                    </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <Link
                    to="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors group"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    Dashboard
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors group"
                  >
                    <Settings className="w-4 h-4 mr-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    Account Settings
                  </Link>
                </div>

                {/* Destructive Actions */}
                <div className="border-t border-gray-100 py-2 bg-gray-50/30">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-5 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors group"
                  >
                    <LogOut className="w-4 h-4 mr-3 text-gray-400 group-hover:text-red-500 transition-colors" />
                    Sign out
                  </button>
                  <button
                    onClick={handleLogoutFromAllDevices}
                    className="w-full flex items-center px-5 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors group"
                  >
                    <Smartphone className="w-4 h-4 mr-3 text-gray-400 group-hover:text-red-500 transition-colors" />
                    Sign out all devices
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;