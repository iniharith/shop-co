/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { create } from "zustand";

export interface ChatTypingInfo {
  userId: string;
  userName: string;
  typing: boolean;
  at: number;
}

interface ChatTypingState {
  typing: Record<string, ChatTypingInfo>;
  setTyping: (conversationId: string, info: ChatTypingInfo) => void;
  clearTyping: (conversationId: string) => void;
}

const TYPING_TTL = 5000;

export const useChatTypingStore = create<ChatTypingState>((set) => ({
  typing: {},
  setTyping: (conversationId, info) => {
    if (!info.typing) {
      set((state) => {
        if (!state.typing[conversationId]) return state;
        const { [conversationId]: _removed, ...rest } = state.typing;
        return { typing: rest };
      });
      return;
    }
    set((state) => ({ typing: { ...state.typing, [conversationId]: info } }));
    // Auto-clear stale streams so a dropped/stopped typer never leaves a
    // ghost indicator behind.
    setTimeout(() => {
      const current = useChatTypingStore.getState().typing[conversationId];
      if (current && current.at === info.at) {
        useChatTypingStore.getState().clearTyping(conversationId);
      }
    }, TYPING_TTL);
  },
  clearTyping: (conversationId) => {
    set((state) => {
      if (!state.typing[conversationId]) return state;
      const { [conversationId]: _removed, ...rest } = state.typing;
      return { typing: rest };
    });
  },
}));
