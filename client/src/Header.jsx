import React, { useState, useRef } from "react";
import { Search, Settings, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const useOutsideClick = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      // Do nothing if clicking ref's element or descendent elements
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


  useOutsideClick(dropdownRef, () => {
    if (dropdownOpen) setDropdownOpen(false);
  });

  const handleLogout = async () => {
    const response = await fetch("http://localhost:4000/user/logout", {
      method: "POST",
      credentials: "include",
    });
    if (response.ok) {
      navigate("/login");
    }
    setDropdownOpen(false);
  };

  const handleLogoutFromAllDevices = async () => {
    const response = await fetch("http://localhost:4000/user/logout-all", {
      method: "POST",
      credentials: "include",
    });
    if (response.ok) {
      navigate("/login");
    }
    setDropdownOpen(false);
  };

  // This is a placeholder for when the user data is loading
  const renderLoadingSkeleton = () => (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 animate-pulse" />
  );

  const renderUserAvatar = () => (
    <button
      onClick={() => setDropdownOpen((prev) => !prev)}
      className="flex items-center rounded-full justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      {/* You can add a real avatar URL to your user object later */}
      {/* {user ? <img className="rounded-full" src={user.picture} alt="" /> :  */}
      <User className="w-6 h-6 text-gray-600" />
      {/* // } */}
    </button>
  );

  const fetchUser = async () => {
    try {
      const response = await fetch("http://localhost:4000/user", {
        credentials: "include",
      });

      if (response.status === 401 || response.status === 403) {
        setUser(null);
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch user details");

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
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section: Title and Search */}
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900">My Drive</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search in Drive"
              className="pl-10 pr-4 py-2 w-96 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right Section: Icons and User Dropdown */}
        <div className="flex items-center space-x-2">
          {/* This is the container for the user dropdown and its trigger */}
          <div className="relative" ref={dropdownRef}>
            {/* <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center cursor-pointer justify-center w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <img
                src={user.avatarUrl}
                alt="User Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            </button> */}
            {loading
              ? renderLoadingSkeleton()
              : user
              ? renderUserAvatar()
              : null}

            {/* The Dropdown Menu */}
            {dropdownOpen && user && (
              <div className="absolute top-14 right-0 bg-white border rounded-lg shadow-lg w-72 z-10">
                <div className="px-4 py-3">
                  <p className="text-lg font-semibold text-gray-800">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
                <div className="border-t border-gray-200" />
                <div className="py-1">
                  <Link
                    to="/dashboard"
                    onClick={() => setDropdownOpen(false)} // Close dropdown on navigation
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Manage your Account
                  </Link>
                </div>
                <div className="border-t border-gray-200" />
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm cursor-pointer text-gray-700 hover:bg-red-50 hover:text-red-600"
                  >
                    Logout
                  </button>
                  <button
                    onClick={handleLogoutFromAllDevices}
                    className="w-full text-left px-4 py-2 text-sm cursor-pointer text-gray-700 hover:bg-red-50 hover:text-red-600"
                  >
                    Logout from all devices
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
