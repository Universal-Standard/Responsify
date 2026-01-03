import { useState } from "react";
import { useAuth } from "../../hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "preferences" | "api">("profile");

  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
  });

  const [preferencesData, setPreferencesData] = useState({
    theme: "system",
    compactMode: false,
    emailNotifications: true,
    analysisNotifications: true,
  });

  const updateProfile = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const res = await fetch(`/api/users/${user?.id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    },
  });

  const updatePreferences = useMutation({
    mutationFn: async (data: typeof preferencesData) => {
      const res = await fetch(`/api/users/${user?.id}/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update preferences");
      return res.json();
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="md:w-64 flex-shrink-0">
          <nav className="bg-white rounded-lg shadow-sm border p-2 space-y-1">
            {[
              { id: "profile", label: "Profile", icon: "👤" },
              { id: "account", label: "Account", icon: "⚙️" },
              { id: "preferences", label: "Preferences", icon: "🎨" },
              { id: "api", label: "API Keys", icon: "🔑" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                  activeTab === tab.id
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "hover:bg-gray-50"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {activeTab === "profile" && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Profile Information</h2>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-700">
                      {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{user?.email}</p>
                      <p className="text-sm text-gray-600">@{user?.githubUsername}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Display Name</label>
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      rows={4}
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <button
                    onClick={() => updateProfile.mutate(profileData)}
                    disabled={updateProfile.isPending}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {updateProfile.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "account" && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Account Settings</h2>

                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          {user?.role === "enterprise" ? "Enterprise" : user?.role === "pro" ? "Pro" : "Free"} Plan
                        </h3>
                        <p className="text-sm text-gray-600">
                          {user?.role === "free" && "10 analyses per month"}
                          {user?.role === "pro" && "100 analyses per month"}
                          {user?.role === "enterprise" && "Unlimited analyses"}
                        </p>
                      </div>
                      {user?.role === "free" && (
                        <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                          Upgrade
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border rounded-lg p-6">
                    <h3 className="font-semibold mb-4">Usage This Month</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Analyses</span>
                          <span>{user?.analysisCount || 0} / {user?.role === "free" ? "10" : user?.role === "pro" ? "100" : "∞"}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${Math.min(((user?.analysisCount || 0) / (user?.role === "free" ? 10 : 100)) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-red-200 rounded-lg p-6">
                    <h3 className="font-semibold text-red-600 mb-2">Danger Zone</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Deleting your account is permanent and cannot be undone.
                    </p>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Preferences</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Theme</label>
                    <select
                      value={preferencesData.theme}
                      onChange={(e) => setPreferencesData({ ...preferencesData, theme: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="system">System</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Compact Mode</p>
                      <p className="text-sm text-gray-600">Show more content in less space</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferencesData.compactMode}
                        onChange={(e) => setPreferencesData({ ...preferencesData, compactMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive updates via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferencesData.emailNotifications}
                        onChange={(e) => setPreferencesData({ ...preferencesData, emailNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Analysis Notifications</p>
                      <p className="text-sm text-gray-600">Get notified when analysis completes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferencesData.analysisNotifications}
                        onChange={(e) => setPreferencesData({ ...preferencesData, analysisNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <button
                    onClick={() => updatePreferences.mutate(preferencesData)}
                    disabled={updatePreferences.isPending}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {updatePreferences.isPending ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div>
                <h2 className="text-2xl font-bold mb-6">API Keys</h2>

                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      API keys allow you to access ResponsiAI programmatically. Keep your keys secure and never share them publicly.
                    </p>
                  </div>

                  <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    + Generate New API Key
                  </button>

                  <div className="border rounded-lg p-6 text-center text-gray-500">
                    No API keys yet. Generate one to get started.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
