// userStore.js
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { create } from "zustand";
import { db } from "./firebase";
import upload from "./upload";

export const useUserStore = create((set, get) => ({
  currentUser: null,
  isLoading: true,
  unsubscribe: null,

  // Fetch user info
  fetchUserInfo: async (uid) => {
    if (!uid) {
      set({ currentUser: null, isLoading: false });
      return;
    }

    try {
      const userDocRef = doc(db, "users", uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          set({ currentUser: doc.data(), isLoading: false });
        } else {
          set({ currentUser: null, isLoading: false });
        }
      });

      // Store unsubscribe function for cleanup
      set({ unsubscribe });
    } catch (err) {
      console.error("Error fetching user info:", err);
      set({ currentUser: null, isLoading: false });
    }
  },

  // Update user info
  updateUser: async (newData) => {
    try {
      const userId = get().currentUser?.id;
      if (!userId) throw new Error("User not logged in");

      const updateData = { ...newData };

      // Handle avatar upload using Cloudinary
      if (updateData.avatarFile) {
        const avatarUrl = await upload(updateData.avatarFile);
        updateData.avatar = avatarUrl;
        delete updateData.avatarFile;
      }

      // Update Firestore
      await updateDoc(doc(db, "users", userId), updateData);

      // Update local state
      set((state) => ({
        currentUser: {
          ...state.currentUser,
          ...updateData,
        },
      }));

      return true;
    } catch (err) {
      console.error("Error updating user:", err);
      throw err;
    }
  },

  // Clear user data
  clearUser: () => {
    const unsubscribe = get().unsubscribe;
    if (unsubscribe) unsubscribe();
    set({ currentUser: null, isLoading: true });
  },
}));
