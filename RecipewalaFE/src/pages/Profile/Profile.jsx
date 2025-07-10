import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { userService } from "../../services/userService";
import toast from "react-hot-toast";

const Profile = () => {
  const { user, setCredentials, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ username: "", email: "" });
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const fileInputRef = useRef();

  useEffect(() => {
    userService.getProfile()
      .then((res) => {
        const user = res.data?.user || res.data?.data?.user || res.data;
        setProfile(user);
        setForm({
          username: user?.username || "",
          email: user?.email || "",
        });
        setImagePreview(user?.image || "");
      })
      .catch((err) => {
        console.error('Full error:', err.response);
        toast.error(err.response?.data?.message || "Failed to load profile");
      });
  }, []);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    setForm({
      username: profile?.username || "",
      email: profile?.email || "",
    });
    setImagePreview(profile?.image || "");
    setImageFile(null);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", form.username);
      if (imageFile) formData.append("image", imageFile);
      const res = await userService.updateProfile(formData);
      setProfile(res.data.user);
      setEditMode(false);
      setImageFile(null);
      setImagePreview(res.data.user.image || "");
      setCredentials({ user: res.data.user });
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.deleteAccount(deletePassword);
      toast.success("Account deleted");
      logout();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
      setDeletePassword("");
    }
  };

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center text-gray-500">Loading profile...</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile</h1>
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="relative w-28 h-28">
            <img
              src={
                imagePreview
                  ? imagePreview.startsWith('/uploads/')
                    ? `http://localhost:5000${imagePreview}`
                    : imagePreview
                  : "/default-avatar.png"
              }
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover border border-gray-300"
            />
            {editMode && (
              <button
                type="button"
                className="absolute bottom-0 right-0 bg-gray-800 text-white rounded-full p-2 text-xs hover:bg-gray-700"
                onClick={() => fileInputRef.current.click()}
              >
                Change
              </button>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImageChange}
              disabled={!editMode}
            />
          </div>
          {!editMode ? (
            <>
              <div className="text-lg font-semibold">{profile.username}</div>
              <div className="text-gray-500">{profile.email}</div>
            </>
          ) : (
            <form className="w-full max-w-sm flex flex-col gap-3" onSubmit={handleSave}>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                className="border rounded px-3 py-2 w-full"
                minLength={3}
                maxLength={20}
                pattern="^[a-zA-Z0-9_]+$"
                required
              />
              <label className="block text-sm font-medium text-gray-700 mt-2">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                className="border rounded px-3 py-2 w-full bg-gray-100 cursor-not-allowed"
                disabled
              />
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
        {!editMode && (
          <div className="flex gap-3 justify-center mt-4">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={handleEdit}
            >
              Edit Profile
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              onClick={() => setDeleteMode(true)}
            >
              Delete Account
            </button>
          </div>
        )}
        {deleteMode && (
          <form className="mt-8 bg-red-50 border border-red-200 rounded p-4" onSubmit={handleDelete}>
            <div className="mb-2 text-red-700 font-semibold">Are you sure you want to delete your account? This action cannot be undone.</div>
            <input
              type="password"
              placeholder="Enter your password to confirm"
              className="border rounded px-3 py-2 w-full mb-2"
              value={deletePassword}
              onChange={e => setDeletePassword(e.target.value)}
              required
              disabled={loading}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Account"}
              </button>
              <button
                type="button"
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                onClick={() => setDeleteMode(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;