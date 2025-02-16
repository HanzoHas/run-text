// chatStore.js
import { create } from "zustand";
import { useUserStore } from "./userStore";

export const useChatStore = create((set) => ({
  chatId: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,

  changeChat: (chatId, user) => {
    const currentUser = useUserStore.getState().currentUser || { blocked: [] };
    const targetUser = user || { blocked: [] };

    const checks = {
      isCurrentUserBlocked: targetUser.blocked?.includes(currentUser.id),
      isReceiverBlocked: currentUser.blocked?.includes(targetUser.id),
    };

    set({
      chatId,
      user: checks.isCurrentUserBlocked ? null : targetUser,
      ...checks,
    });
  },

  toggleBlock: () =>
    set((state) => ({
      isReceiverBlocked: !state.isReceiverBlocked,
    })),

  resetChat: () =>
    set({
      chatId: null,
      user: null,
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
    }),
}));
