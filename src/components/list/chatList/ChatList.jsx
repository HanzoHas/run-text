import { useEffect, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedChat, setSelectedChat] = useState(null);

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  useEffect(() => {
    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        const data = res.data();
        if (!data) return;
        const items = data.chats || [];

        const promises = items.map(async (item) => {
          const userDocRef = doc(db, "users", item.receiverId);
          const userDocSnap = await getDoc(userDocRef);
          const user = userDocSnap.data() || {}; 
          return { ...item, user };
        });

        const chatData = await Promise.all(promises);
        setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
      }
    );

    return () => {
      unSub();
    };
  }, [currentUser.id]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowContextMenu(false);
      setSelectedChat(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex(
      (item) => item.chatId === chat.chatId
    );

    if (chatIndex >= 0) {
      userChats[chatIndex].isSeen = true;
    }

    const userChatsRef = doc(db, "userchats", currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
      changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat) return;

    const userChatsRef = doc(db, "userchats", currentUser.id);
    try {
      const userChatsDoc = await getDoc(userChatsRef);
      if (userChatsDoc.exists()) {
        const userChatsData = userChatsDoc.data();
        const updatedChats = userChatsData.chats.filter(
          (item) => item.chatId !== selectedChat.chatId
        );
        
        await updateDoc(userChatsRef, { chats: updatedChats });
        
        // Reset current chat if deleted chat is active
        if (chatId === selectedChat.chatId) {
          changeChat(null, null);
        }
      }
    } catch (err) {
      console.error("Error deleting chat: ", err);
    } finally {
      setShowContextMenu(false);
      setSelectedChat(null);
    }
  };

  const filteredChats = chats.filter((c) =>
    c.user?.username?.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="Search Icon" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt="Add or Remove"
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>

      {filteredChats.map((chat) => (
        <div
          className="item"
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
          onContextMenu={(e) => {
            e.preventDefault();
            setSelectedChat(chat);
            setContextMenuPosition({ x: e.clientX, y: e.clientY });
            setShowContextMenu(true);
          }}
          style={{
            backgroundColor: chat?.isSeen ? "transparent" : "#5183fe",
          }}
        >
          <img
            src={
              chat.user?.blocked?.includes(currentUser.id)
                ? "./avatar.png"
                : chat.user?.avatar || "./avatar.png"
            }
            alt="User Avatar"
          />
          <div className="texts">
            <span>
              {chat.user?.blocked?.includes(currentUser.id)
                ? "User"
                : chat.user?.username || "Unknown"}
            </span>
            <p>{chat.lastMessage}</p>
          </div>
        </div>
      ))}

      {showContextMenu && (
        <div
          className="context-menu"
          style={{
            position: "fixed",
            top: contextMenuPosition.y,
            left: contextMenuPosition.x,
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-item" onClick={handleDeleteChat}>
            Delete Chat
          </div>
        </div>
      )}

      {addMode && <AddUser />}
    </div>
  );
};

export default ChatList;