// userinfo.jsx
import "./userInfo.css";
import { useUserStore } from "../../../lib/userStore";
import { useState, useEffect } from "react";

const Userinfo = () => {
  const { currentUser, updateUser } = useUserStore();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    description: "",
    avatarFile: null,
    avatarPreview: "./avatar.png",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize form data
  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || "",
        description: currentUser.description || "",
        avatarFile: null,
        avatarPreview: currentUser.avatar || "./avatar.png",
      });
    }
  }, [currentUser]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          avatarPreview: reader.result,
          avatarFile: file,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await updateUser({
        username: formData.username,
        description: formData.description,
        avatarFile: formData.avatarFile,
      });

      if (success) {
        setIsEditOpen(false);
      }
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="userInfo">
      <div className="user">
        <img src={currentUser.avatar || "./avatar.png"} alt="avatar" />
        <h2>{currentUser.username}</h2>
      </div>
      <div className="icons">
        <img
          src="./edit.png"
          alt="edit"
          onClick={() => setIsEditOpen(true)}
        />
      </div>

      {isEditOpen && (
        <div className="modal-overlay">
          <div className="edit-modal">
            <h2>Edit Profile</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <img
                  src={formData.avatarPreview}
                  alt="preview"
                  className="avatar-preview"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Userinfo;
