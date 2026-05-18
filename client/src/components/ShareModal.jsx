import { useState } from "react";
import {
  X,
  Link as LinkIcon,
  Mail,
  Users,
  Copy,
  Check,
  ChevronDown,
  Plus,
  Loader2,
} from "lucide-react";

// Mock data for demonstration
const MOCK_USERS = [
  {
    id: 1,
    name: "codxv enu",
    email: "codxv.enu@gmail.com",
    avatar: "https://github.com/shadcn.png",
  },
  {
    id: 2,
    name: "Sahil",
    email: "kunalsahil.os@gmail.com",
    avatar: "https://github.com/shadcn.png",
  },
  {
    id: 3,
    name: "NoCashxD",
    email: "sandeepwaraki3@gmail.com",
    avatar: "https://github.com/shadcn.png",
  },
];

const SHARED_WITH_USERS = [
  {
    id: 4,
    name: "Karan Khandekar",
    email: "karan.khandekar02@gmail.com",
    avatar: "https://github.com/shadcn.png",
    role: "Editor",
    sharedOn: "Nov 25, 2023, 05:14 PM",
  },
  {
    id: 5,
    name: "Anurag Singh",
    email: "anuragsinghbsm@gmail.com",
    avatar: "https://github.com/shadcn.png",
    role: "Viewer",
    sharedOn: "Nov 25, 2023, 05:14 PM",
  },
];

export default function ShareModal({ fileId, show, onClose }) {
  const [activeTab, setActiveTab] = useState("link");
  const [isLinkSharingEnabled, setIsLinkSharingEnabled] = useState(true);
  const [linkPermission, setLinkPermission] = useState("Viewer");
  const [isCopied, setIsCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sharedWith, setSharedWith] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      "https://app.storemystuff.cloud/guest/access/69fdd93abef631017f1d33a3d71c"
    );
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const filteredUsers =
    searchQuery === ""
      ? []
      : MOCK_USERS.filter(
          (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );

  // 3. Check if we should show the "Invite External Email" option
  // Show if: Query is valid email AND not already found in search results AND not already selected
  const showExternalInvite =
    isValidEmail(searchQuery) &&
    !filteredUsers.some(
      (u) => u.email.toLowerCase() === searchQuery.toLowerCase()
    ) &&
    !selectedUsers.some(
      (u) => u.email.toLowerCase() === searchQuery.toLowerCase()
    );

  const handleSelectUser = (user) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, { ...user, role: "Viewer" }]);
    }
    setSearchQuery("");
  };

  const handleAddExternalEmail = () => {
    const newUser = {
      id: `guest-${Date.now()}`, // Temporary ID
      name: searchQuery.split("@")[0], // Use email prefix as temp name
      email: searchQuery,
      avatar: null, // No avatar for external users
      role: "Viewer",
      isExternal: true, // Flag to identify this is an invite
    };
    setSelectedUsers([...selectedUsers, newUser]);
    setSearchQuery("");
  };

  const getFileSharedWith = async (fileId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/share/shared-with/${fileId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      if (data.success) {
        console.log(data);
        setSharedWith(data.sharedWith);
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSendInvites = async (fileId) => {
    for (let i = 0; i < selectedUsers.length; i++) {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/share/email/${fileId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: selectedUsers[i].email,
            role: selectedUsers[i].role,
          }),
        }
      );
      if (!response.ok) {
        continue;
      }
      const data = await response.json();
      console.log(data);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl  font-sans">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                <Users className="w-5 h-5" />
              </span>
              Share Document
            </h3>
            <p className="text-gray-500 text-sm mt-1 ml-9">
              Collaborate with others
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-gray-100">
          <TabButton
            icon={<LinkIcon className="w-4 h-4" />}
            label="Share Link"
            isActive={activeTab === "link"}
            onClick={() => setActiveTab("link")}
          />
          <TabButton
            icon={<Mail className="w-4 h-4" />}
            label="Email Invite"
            isActive={activeTab === "email"}
            onClick={() => setActiveTab("email")}
          />
          <TabButton
            icon={<Users className="w-4 h-4" />}
            label="Shared With"
            isActive={activeTab === "shared"}
            onClick={() => {
              setActiveTab("shared"), getFileSharedWith(fileId);
            }}
            count={SHARED_WITH_USERS.length}
          />
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "link" && (
            <div className="space-y-6">
              {/* Share with link toggle */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900">Share with link</h4>
                  <p className="text-gray-500 text-sm">
                    Anyone with the link can access
                  </p>
                </div>
                <button
                  onClick={() => setIsLinkSharingEnabled(!isLinkSharingEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isLinkSharingEnabled ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isLinkSharingEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {isLinkSharingEnabled && (
                <>
                  {/* Permission level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permission level
                    </label>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      {["Viewer", "Editor"].map((permission) => (
                        <button
                          key={permission}
                          onClick={() => setLinkPermission(permission)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                            linkPermission === permission
                              ? "bg-white text-blue-600 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {permission}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Share link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Share link
                    </label>
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                      <input
                        type="text"
                        readOnly
                        value="https://app.storemystuff.cloud/guest/access/69fdd..."
                        className="flex-1 p-3 text-sm text-gray-600 bg-gray-50 outline-none"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 flex items-center gap-2 text-sm font-medium transition-colors"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-4 h-4" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" /> Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "email" && (
            <div className="space-y-6">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select users to invite
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Name or email address"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && showExternalInvite) {
                        handleAddExternalEmail();
                      }
                    }}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                  <Users className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                </div>

                {/* Dropdown Logic */}
                {(filteredUsers.length > 0 || showExternalInvite) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto py-1">
                    {/* Existing Users (Friends) */}
                    {filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full border border-gray-200"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </button>
                    ))}

                    {/* Separator if both exist */}
                    {filteredUsers.length > 0 && showExternalInvite && (
                      <div className="border-t border-gray-100 my-1"></div>
                    )}

                    {/* External Email Option */}
                    {showExternalInvite && (
                      <button
                        onClick={handleAddExternalEmail}
                        className="flex items-center gap-3 w-full p-3 hover:bg-blue-50 transition-colors text-left group"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                            Invite{" "}
                            <span className="font-semibold">
                              "{searchQuery}"
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Send an email invitation
                          </p>
                        </div>
                        <Plus className="w-4 h-4 text-blue-400 ml-auto mr-2" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Users List */}
              {selectedUsers.length > 0 && (
                <div className="animate-in fade-in slide-in-from-top-2  max-h-[240px]  overflow-y-auto duration-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center justify-between">
                    <span>To be invited</span>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                      {selectedUsers.length}
                    </span>
                  </h4>
                  <div className="space-y-3 pr-2">
                    {selectedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg group hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar with Fallback for External Users */}
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-9 h-9 rounded-full border border-gray-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {user.name}
                              {user.isExternal && (
                                <span className="ml-2 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  Guest
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <PermissionDropdown
                            currentRole={user.role}
                            onChange={(newRole) => {
                              setSelectedUsers(
                                selectedUsers.map((u) =>
                                  u.id === user.id ? { ...u, role: newRole } : u
                                )
                              );
                            }}
                          />
                          <button
                            onClick={() =>
                              setSelectedUsers(
                                selectedUsers.filter((u) => u.id !== user.id)
                              )
                            }
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSendInvites(fileId)}
                    className="w-full  mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-medium shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Send {selectedUsers.length} Invite
                    {selectedUsers.length !== 1 ? "s" : ""}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "shared" &&
            (loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : sharedWith?.length === 0 ? (  
              <div className="flex items-center justify-center h-full">
                <Users className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" /> Users with Access
                </h4>
                <div className="space-y-4">
                  {sharedWith?.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar || "https://github.com/shadcn.png"}
                          alt={user._id.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user._id.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {user._id.email}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            Shared on {user.sharedOn}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PermissionDropdown
                          currentRole={user.role}
                          showStatus
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function TabButton({ icon, label, isActive, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors relative ${
        isActive
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {icon}
      {label}
      {count > 0 && (
        <span
          className={`ml-1.5 py-0.5 px-2 rounded-full text-xs ${
            isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function PermissionDropdown({ currentRole, onChange, showStatus }) {
  const [isOpen, setIsOpen] = useState(false);

  const roles = ["Viewer", "Editor"];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
      >
        {currentRole}
        <ChevronDown className="w-3 h-3 text-gray-400" />
        {showStatus && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
        )}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => {
                  onChange && onChange(role);
                  setIsOpen(false);
                }}
                className={`flex items-center w-full px-4 py-2 text-xs text-left hover:bg-gray-50 ${
                  role === currentRole
                    ? "text-blue-600 font-medium"
                    : "text-gray-700"
                }`}
              >
                {role}
                {role === currentRole && <Check className="w-3 h-3 ml-auto" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
