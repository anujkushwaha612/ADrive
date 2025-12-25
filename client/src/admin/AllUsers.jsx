import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AllUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // STATE FOR MODAL
  // format: { type: 'logout' | 'delete', userId: string, userName: string } | null
  const [confirmation, setConfirmation] = useState(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:4000/admin/users", {
        method: "GET",
        credentials: "include",
      });
      if (response.status === 401) {
        setError("Not logged in");
        navigate("/login");
        return;
      } else if (response.status === 403) {
        setError("Unauthorized");
        navigate("/Unauthorized");
        return;
      }
      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();
      setUsers(data.usersWithStatus || []);
      setRole(data.role);
      setCurrentUserId(data.currentUserId);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Could not load users. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // 1. OPEN MODAL HELPERS
  const requestLogout = (user) => {
    setConfirmation({ type: "logout", userId: user._id, userName: user.name });
  };

  const requestDelete = (user) => {
    setConfirmation({ type: "delete", userId: user._id, userName: user.name });
  };

  const closeModal = () => {
    setConfirmation(null);
    setIsProcessingAction(false);
  };

  // 2. EXECUTE ACTIONS
  const handleConfirmAction = async () => {
    if (!confirmation) return;
    setIsProcessingAction(true);

    const { type, userId } = confirmation;

    try {
      if (type === "logout") {
        const response = await fetch(
          "http://localhost:4000/admin/logout-user",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ userId }),
          }
        );

        if (response.ok) {
          // Optimistic update: find user and set status to offline locally
          setUsers((prev) =>
            prev.map((u) =>
              u._id === userId ? { ...u, isLoggedIn: false } : u
            )
          );
        } else {
          alert("Failed to logout user");
        }
      } else if (type === "delete") {
        const response = await fetch(
          `http://localhost:4000/admin/delete/${userId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (response.ok) {
          setUsers((prev) => prev.filter((u) => u._id !== userId));
        } else {
          const errData = await response.json();
          alert(errData.message || "Failed to delete user.");
        }
      }
    } catch (error) {
      console.error("Action failed:", error);
      alert("Something went wrong.");
    } finally {
      closeModal();
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800 relative">
      {/* --- CONFIRMATION MODAL --- */}
      {confirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            {/* Modal Header */}
            <div
              className={`p-6 border-b flex items-center gap-4 ${
                confirmation.type === "delete" ? "bg-red-50" : "bg-amber-50"
              }`}
            >
              <div
                className={`p-3 rounded-full ${
                  confirmation.type === "delete"
                    ? "bg-red-100 text-red-600"
                    : "bg-amber-100 text-amber-600"
                }`}
              >
                {/* Warning Icon */}
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {confirmation.type === "delete"
                    ? "Delete User?"
                    : "Force Logout?"}
                </h3>
                <p
                  className={`text-sm ${
                    confirmation.type === "delete"
                      ? "text-red-600"
                      : "text-amber-600"
                  }`}
                >
                  Action Required
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-600 mb-2">
                You are about to{" "}
                <strong>
                  {confirmation.type === "delete"
                    ? "permanently delete"
                    : "logout"}
                </strong>{" "}
                the user:
              </p>
              <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 font-medium text-gray-800 text-center mb-4">
                {confirmation.userName}
              </div>
              <p className="text-sm text-gray-500">
                {confirmation.type === "delete"
                  ? "This action cannot be undone. All data associated with this user will be removed."
                  : "The user will be disconnected immediately and will need to log in again."}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 flex gap-3 justify-end border-t">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={isProcessingAction}
                className={`px-4 py-2 text-white rounded-lg font-medium shadow-sm flex items-center gap-2 transition-colors ${
                  confirmation.type === "delete"
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    : "bg-amber-500 hover:bg-amber-600 focus:ring-amber-500"
                }`}
              >
                {isProcessingAction && (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {confirmation.type === "delete"
                  ? "Yes, Delete User"
                  : "Yes, Force Logout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">
            Manage access and active sessions
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg shadow-sm transition-all active:scale-95"
        >
          <svg
            className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh List
        </button>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* --- GRID --- */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? [...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))
          : users.map((user) => (
              <div
                key={user._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden"
              >
                <div className="p-6 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 ${
                        user.isLoggedIn
                          ? "bg-green-50 text-green-600 border-green-200"
                          : "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {user.name}
                      </h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.isLoggedIn
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        user.isLoggedIn
                          ? "bg-green-500 animate-pulse"
                          : "bg-gray-400"
                      }`}
                    ></span>
                    {user.isLoggedIn ? "Online" : "Offline"}
                  </div>
                </div>

                <div className="mt-auto border-t border-gray-100 bg-gray-50/50 p-4 flex justify-end gap-3">
                  {/* UPDATE: These buttons now call requestLogout / requestDelete */}
                  <button
                    disabled={!user.isLoggedIn}
                    onClick={() => requestLogout(user)}
                    className={`text-xs px-3 py-2 rounded-lg font-medium transition-colors border ${
                      user.isLoggedIn
                        ? "bg-white text-amber-600 border-amber-200 hover:bg-amber-50"
                        : "text-gray-300 border-gray-200 cursor-not-allowed bg-transparent"
                    }`}
                  >
                    Force Logout
                  </button>

                  {role === "admin" && (
                    <button
                      // Disable if the row's user._id matches the logged-in currentUserId
                      disabled={user._id === currentUserId}
                      onClick={() => requestDelete(user)}
                      // Add conditional styling to look "disabled" visually
                      className={`text-xs px-3 py-2 rounded-lg font-medium transition-colors border shadow-sm ${
                        user._id === currentUserId
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" // Disabled Style
                          : "bg-white text-red-600 border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600" // Active Style
                      }`}
                    >
                      Delete User
                    </button>
                  )}
                </div>
              </div>
            ))}
      </div>

      {!isLoading && users.length === 0 && !error && (
        <div className="text-center py-20 text-gray-400">
          <p>No users found in the database.</p>
        </div>
      )}
    </div>
  );
};

export default AllUsers;
