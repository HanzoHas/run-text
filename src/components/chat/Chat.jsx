import { useEffect, useRef, useState } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc, setDoc, collection } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useChatStore } from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { format } from "timeago.js";
import Details from "../detail/Detail";

const Chat = () => {
  const [chat, setChat] = useState({ messages: [], typing: {} });
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({ file: null, url: "" });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    messageId: null,
    messageSenderId: null,
  });
  const [showDetails, setShowDetails] = useState(false);
  const [selectedWallpaper, setSelectedWallpaper] = useState("");
  const endRef = useRef(null);

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeChat } = useChatStore();

  useEffect(() => {
    if (currentUser?.chatWallpaper) {
      setSelectedWallpaper(currentUser.chatWallpaper);
    }
  }, [currentUser]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  useEffect(() => {
    if (!chatId) return;
    const unsub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data() || { messages: [], typing: {} });
    });
    return () => unsub();
  }, [chatId]);

  const handleSend = async () => {
    if ((!text.trim() && !img.file) || isCurrentUserBlocked || isReceiverBlocked) return;

    try {
      let imgUrl = null;
      if (img.file) {
        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append("file", img.file);
        formData.append("upload_preset", "chat-app-upload");

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/dpfoovqr6/image/upload`,
          { method: "POST", body: formData }
        );

        const data = await response.json();
        imgUrl = data.secure_url;
        setIsUploading(false);
        setUploadProgress(0);
      }

      await sendMessage(imgUrl);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const sendMessage = async (imgUrl = null) => {
    let chatDocId = chatId;

    if (!chatDocId) {
      const newChatRef = doc(collection(db, "chats"));
      await setDoc(newChatRef, { messages: [], typing: {} });
      chatDocId = newChatRef.id;

      const newChatData = {
        chatId: newChatRef.id,
        receiverId: user.id,
        updatedAt: new Date(),
        lastMessage: text,
      };

      const currentUserChatsRef = doc(db, "userchats", currentUser.id);
      const receiverChatsRef = doc(db, "userchats", user.id);

      await setDoc(currentUserChatsRef, { chats: arrayUnion(newChatData) }, { merge: true });
      await setDoc(receiverChatsRef, { chats: arrayUnion({ ...newChatData, receiverId: currentUser.id }) }, { merge: true });

      changeChat(newChatRef.id, user);
    }

    await updateDoc(doc(db, "chats", chatDocId), {
      messages: arrayUnion({
        id: Date.now(),
        senderId: currentUser.id,
        text,
        img: imgUrl,
        createdAt: new Date(),
      }),
    });

    setText("");
    setImg({ file: null, url: "" });
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleMessageRightClick = (e, messageId, messageSenderId) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      messageId,
      messageSenderId,
    });
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu.visible]);

  const handleContextMenuAction = async (action, messageId) => {
    switch (action) {
      case "copy": {
        const messageText = chat.messages.find((msg) => msg.id === messageId)?.text;
        if (messageText) {
          navigator.clipboard.writeText(messageText);
        }
        break;
      }
      case "delete": {
        const confirmDelete = window.confirm("Are you sure you want to delete this message?");
        if (!confirmDelete) return;
        await deleteMessage(messageId);
        break;
      }
      default:
        break;
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const deleteMessage = async (messageId) => {
    try {
      const chatDocRef = doc(db, "chats", chatId);
      const chatDoc = await getDoc(chatDocRef);
      if (!chatDoc.exists()) return;

      const messages = chatDoc.data().messages;
      const messageIndex = messages.findIndex((msg) => msg.id === messageId);
      if (messageIndex === -1) return;

      const updatedMessage = {
        ...messages[messageIndex],
        isDeleted: true,
        text: "",
        img: null,
      };

      const newMessages = [...messages];
      newMessages[messageIndex] = updatedMessage;

      await updateDoc(chatDocRef, { messages: newMessages });
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  return (
    <div className={`chat-container ${showDetails ? "show-details" : ""}`}>
      <div className="chat">
        <div className="top">
          <div className="user">
            <img src={user?.avatar || "./avatar.png"} alt={user?.username} />
            <div className="texts">
              <span>{user?.username}</span>
              <p>{user?.description || "Active now"}</p>
            </div>
          </div>
          <div className="icons">
            <img
              src="./info.png"
              alt="Info"
              onClick={() => setShowDetails(!showDetails)}
              className="info-icon"
            />
          </div>
        </div>

        <div
          className="center"
          style={{ backgroundImage: `url(${selectedWallpaper})` }}
        >
          {chat.messages.map((message) => {
            const timestamp = message.createdAt?.toDate
              ? message.createdAt.toDate()
              : message.createdAt;
            return (
              <div
                className={`message ${message.senderId === currentUser?.id ? "own" : ""}`}
                key={message.id}
                onContextMenu={(e) =>
                  handleMessageRightClick(e, message.id, message.senderId)
                }
              >
                <div className="texts">
                  {message.isDeleted ? (
                    <p className="deleted-message">
                      {message.senderId === currentUser?.id
                        ? "You deleted this message"
                        : "This message was deleted"}
                    </p>
                  ) : (
                    <>
                      {message.img && (
                        <div className="image-container">
                          <img src={message.img} alt="Content" />
                        </div>
                      )}
                      <p>{message.text}</p>
                    </>
                  )}
                  <span>{timestamp ? format(timestamp) : ""}</span>
                </div>
              </div>
            );
          })}
          {img.url && (
            <div className="message own">
              <div className="texts">
                <div className="image-preview-container">
                  <img src={img.url} alt="Preview" />
                  {isUploading && (
                    <div className="upload-overlay">
                      <span className="progress-text">
                        {Math.round(uploadProgress)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <div ref={endRef}></div>
        </div>

        {contextMenu.visible && (
          <div
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={() =>
                handleContextMenuAction("copy", contextMenu.messageId)
              }
            >
              Copy Text
            </button>
            {contextMenu.messageSenderId === currentUser.id && (
              <button
                onClick={() =>
                  handleContextMenuAction("delete", contextMenu.messageId)
                }
              >
                Delete
              </button>
            )}
          </div>
        )}

        <div className="bottom">
          <div className="icons">
            <label htmlFor="file">
              <img src="./img.png" alt="Attach file" />
            </label>
            <input
              type="file"
              id="file"
              style={{ display: "none" }}
              onChange={handleImg}
            />
            <img src="./camera.png" alt="Camera" />
            <img src="./mic.png" alt="Microphone" />
          </div>
          <input
            type="text"
            placeholder={
              isCurrentUserBlocked || isReceiverBlocked
                ? "You cannot send a message"
                : "Type a message..."
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isCurrentUserBlocked || isReceiverBlocked}
          />
          <div className="emoji">
            <img
              src="./emoji.png"
              alt="Emojis"
              onClick={() => setOpen((prev) => !prev)}
            />
            <div className="picker">
              <EmojiPicker open={open} onEmojiClick={(e) => setText((prev) => prev + e.emoji)} />
            </div>
          </div>
          <button
            className="sendButton"
            onClick={handleSend}
            disabled={isCurrentUserBlocked || isReceiverBlocked || isUploading}
          >
            Send
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="details-panel">
          <Details />
          <button className="close-details" onClick={() => setShowDetails(false)}>
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default Chat;