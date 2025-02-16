import "./addUser.css";
import { useState } from "react";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { useUserStore } from "../../../../lib/userStore";

const AddUser = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.target);
    const username = formData.get("username").trim();

    if (!username) {
      setError("Please enter a username.");
      return;
    }

    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username));
      const querySnapShot = await getDocs(q);

      if (!querySnapShot.empty) {
        setUser({ id: querySnapShot.docs[0].id, ...querySnapShot.docs[0].data() });
      } else {
        setError("User not found.");
      }
    } catch (err) {
      setError("Error fetching user.");
      console.error(err);
    }
  };

  const handleAdd = async () => {
    if (!user || !user.id || !currentUser || !currentUser.id) {
      setError("User or currentUser is missing!");
      console.error("Error: Missing user ID or currentUser ID", { user, currentUser });
      return;
    }
  
    try {
      const chatRef = collection(db, "chats");
      const userChatsRef = collection(db, "userchats");

      // Create a new chat document with an auto-generated ID
      const newChatRef = doc(chatRef); 
      if (!newChatRef.id) {
        setError("Failed to create chat.");
        console.error("Error: newChatRef.id is undefined");
        return;
      }
  
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });
  
      const chatData = {
        chatId: newChatRef.id,
        lastMessage: "",
        receiverId: currentUser.id,
        updatedAt: Date.now(),
      };
  
      // Debugging: Log chatData before updating Firestore
      console.log("Adding chat data:", chatData);
  
      // Update the searched user's chat list
      await updateDoc(doc(userChatsRef, user.id), {
        chats: arrayUnion(chatData),
      });
  
      // Update the current user's chat list
      await updateDoc(doc(userChatsRef, currentUser.id), {
        chats: arrayUnion({ ...chatData, receiverId: user.id }),
      });
  
      setUser(null);
      setError(""); // Clear any previous error
    } catch (err) {
      setError("Error adding user.");
      console.error("Firestore Error:", err);
    }
  };
  

  return (
    <div className="addUser">
      <form onSubmit={handleSearch}>
        <input type="text" placeholder="Username" name="username" />
        <button type="submit">Search</button>
      </form>

      {error && <p className="error">{error}</p>}

      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || "./avatar.png"} alt="User Avatar" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>Add User</button>
        </div>
      )}
    </div>
  );
};


export default AddUser;