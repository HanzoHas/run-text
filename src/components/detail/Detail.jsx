import { arrayRemove, arrayUnion, doc, updateDoc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useChatStore } from "../../lib/chatStore";
import { auth, db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import "./detail.css";

const Detail = () => {
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock, resetChat } =
    useChatStore();
  const { currentUser } = useUserStore();
  const [openOptions, setOpenOptions] = useState({
    chatSettings: false,
    privacyHelp: false,
    sharedPhotos: false,
    sharedFiles: false,
  });
  const [sharedPhotos, setSharedPhotos] = useState([]);
  const [selectedWallpaper, setSelectedWallpaper] = useState("");
  const [previousWallpapers, setPreviousWallpapers] = useState([]);

  useEffect(() => {
    const fetchSharedPhotos = async () => {
      if (!chatId) return;

      const chatDocRef = doc(db, "chats", chatId);
      const chatDoc = await getDoc(chatDocRef);

      if (chatDoc.exists()) {
        const messages = chatDoc.data().messages || [];
        const photos = messages
          .filter((message) => message.img)
          .map((message) => message.img);
        setSharedPhotos(photos);
      }
    };

    fetchSharedPhotos();
  }, [chatId]);

  useEffect(() => {
    if (currentUser?.chatWallpaper) {
      setSelectedWallpaper(currentUser.chatWallpaper);
    }
    if (currentUser?.previousWallpapers) {
      setPreviousWallpapers(currentUser.previousWallpapers);
    }
  }, [currentUser]);

  const toggleOption = (option) => {
    setOpenOptions((prev) => ({ ...prev, [option]: !prev[option] }));
  };

  const handleWallpaperUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "chat-app-upload");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dpfoovqr6/image/upload`,
        { method: "POST", body: formData }
      );

      const data = await response.json();
      const newWallpaper = data.secure_url;

      // Update Firestore with new wallpaper and add to previous wallpapers
      const userDocRef = doc(db, "users", currentUser.id);
      await updateDoc(userDocRef, {
        chatWallpaper: newWallpaper,
        previousWallpapers: arrayUnion(newWallpaper),
      });

      setSelectedWallpaper(newWallpaper);
      setPreviousWallpapers((prev) => [newWallpaper, ...prev]);
    } catch (error) {
      console.error("Error uploading wallpaper:", error);
    }
  };

  const handleWallpaperChange = async (wallpaper) => {
    const userDocRef = doc(db, "users", currentUser.id);
    await updateDoc(userDocRef, {
      chatWallpaper: wallpaper,
    });
    setSelectedWallpaper(wallpaper);
  };

  const handleBlock = async () => {
    if (!user) return;
    const userDocRef = doc(db, "users", currentUser.id);
    try {
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
      });
      changeBlock();
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    resetChat();
  };

  return (
    <div className="detail">
      <div className="user">
        <img src={user?.avatar || "./avatar.png"} alt="" />
        <h2>{user?.username}</h2>
        <p>{user?.description || "No description available"}</p>
      </div>
      <div className="info">
        <div className="option">
          <div className="title" onClick={() => toggleOption("chatSettings")}>
            <span>Chat Settings</span>
            <img
              src={openOptions.chatSettings ? "./arrowDown.png" : "./arrowUp.png"}
              alt="toggle"
            />
          </div>
          {openOptions.chatSettings && (
            <div className="content">
              <div className="setting-item">
                <label>Message Notifications</label>
                <select>
                  <option>All messages</option>
                  <option>Mentions only</option>
                  <option>Off</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Chat Background</label>
                <div className="wallpaper-options">
                  <div
                    className="wallpaper-item default"
                    onClick={() => handleWallpaperChange("")}
                  >
                    Default
                  </div>
                  <div
                    className="wallpaper-item"
                    style={{ backgroundImage: "url('/wallpaper1.jpg')" }}
                    onClick={() => handleWallpaperChange("/wallpaper1.jpg")}
                  ></div>
                  <div
                    className="wallpaper-item"
                    style={{ backgroundImage: "url('/wallpaper2.jpg')" }}
                    onClick={() => handleWallpaperChange("/wallpaper2.jpg")}
                  ></div>
                  <label className="custom-wallpaper">
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleWallpaperUpload(e.target.files[0]);
                        }
                      }}
                    />
                    Custom
                  </label>
                </div>
              </div>
              {previousWallpapers.length > 0 && (
                <div className="previous-wallpapers">
                  <h4>Previous Wallpapers</h4>
                  <div className="wallpaper-list">
                    {previousWallpapers.map((wallpaper, index) => (
                      <div
                        key={index}
                        className="wallpaper-item"
                        style={{ backgroundImage: `url(${wallpaper})` }}
                        onClick={() => handleWallpaperChange(wallpaper)}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="option">
          <div className="title" onClick={() => toggleOption("privacyHelp")}>
            <span>Privacy & help</span>
            <img
              src={openOptions.privacyHelp ? "./arrowDown.png" : "./arrowUp.png"}
              alt="toggle"
            />
          </div>
          {openOptions.privacyHelp && (
            <div className="content">
              <div className="privacy-item">
                <h4>Privacy Policy</h4>
                <p>Read our data protection guidelines</p>
              </div>
              <div className="privacy-item">
                <h4>Report User</h4>
                <p>Submit a report about this user</p>
              </div>
              <div className="privacy-item">
                <h4>Help Center</h4>
                <p>Get help with common issues</p>
              </div>
            </div>
          )}
        </div>

        <div className="option">
          <div className="title" onClick={() => toggleOption("sharedPhotos")}>
            <span>Shared photos</span>
            <img
              src={openOptions.sharedPhotos ? "./arrowDown.png" : "./arrowUp.png"}
              alt="toggle"
            />
          </div>
          {openOptions.sharedPhotos && (
            <div className="photos">
              {sharedPhotos.length > 0 ? (
                sharedPhotos.map((photo, index) => (
                  <div className="photoItem" key={index}>
                    <div className="photoDetail">
                      <img src={photo} alt={`shared-${index}`} />
                      <span>photo_{new Date().toISOString().split('T')[0]}_{index}.png</span>
                    </div>
                    <img
                      src="./download.png"
                      alt="download"
                      className="icon"
                      onClick={() => window.open(photo, '_blank')}
                    />
                  </div>
                ))
              ) : (
                <p className="no-photos">No shared photos in this chat</p>
              )}
            </div>
          )}
        </div>

        <div className="option">
          <div className="title" onClick={() => toggleOption("sharedFiles")}>
            <span>Shared Files</span>
            <img
              src={openOptions.sharedFiles ? "./arrowDown.png" : "./arrowUp.png"}
              alt="toggle"
            />
          </div>
          {openOptions.sharedFiles && (
            <div className="files">
              <p className="no-files">No shared files yet</p>
            </div>
          )}
        </div>

        <button onClick={handleBlock}>
          {isCurrentUserBlocked
            ? "You are Blocked!"
            : isReceiverBlocked
            ? "User blocked"
            : "Block User"}
        </button>
        <button className="logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Detail;