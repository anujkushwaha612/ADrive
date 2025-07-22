// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import { useCallback } from "react";

// 1. Create the context
const AuthContext = createContext(null);

// 2. Create the Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start as true to show loading state initially

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
  // The empty dependency array [] means this effect runs only ONCE

  //   const login = useCallback(async (data) => {
  //     const response = await fetch('/api/login', { // This is your backend's login route
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify(data),
  //       });
  //   },[])


  // 3. The value provided to consuming components
  const value = { user, loading,fetchUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 4. Create a custom hook for easy consumption of the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
