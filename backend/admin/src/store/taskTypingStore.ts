/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { create } from "zustand";

export interface TaskTypingInfo {
  userId: string;
  userName: string;
  text: string;
  at: number;
}

interface TaskTypingState {
  typing: Record<string, TaskTypingInfo>;
  setTyping: (taskId: string, info: TaskTypingInfo) => void;
  clearTyping: (taskId: string) => void;
}

const TYPING_TTL = 5000;

export const useTaskTypingStore = create<TaskTypingState>((set) => ({
  typing: {},
  setTyping: (taskId, info) => {
    set((state) => ({ typing: { ...state.typing, [taskId]: info } }));
    // Auto-clear stale streams so a dropped/stopped typer never leaves a
    // ghost preview behind.
    setTimeout(() => {
      const current = useTaskTypingStore.getState().typing[taskId];
      if (current && current.at === info.at) {
        useTaskTypingStore.getState().clearTyping(taskId);
      }
    }, TYPING_TTL);
  },
  clearTyping: (taskId) => {
    set((state) => {
      if (!state.typing[taskId]) return state;
      const { [taskId]: _removed, ...rest } = state.typing;
      return { typing: rest };
    });
  },
}));
