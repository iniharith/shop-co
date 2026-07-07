/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { create } from 'zustand';

export type UploadStatus = 'uploading' | 'success' | 'error';

export interface UploadItem {
  id: string;
  name: string;
  progress: number;
  status: UploadStatus;
  errorMessage?: string;
  taskId?: string;
  tag?: string;
  createdAt: number;
  file?: File; // Store the original file for retry
  abortController?: AbortController; // To actually cancel the XHR request
}

interface UploadStore {
  uploads: Record<string, UploadItem>;
  
  // Actions
  addUpload: (item: Omit<UploadItem, 'progress' | 'status' | 'createdAt'>) => void;
  updateProgress: (id: string, progress: number) => void;
  updateStatus: (id: string, status: UploadStatus, errorMessage?: string) => void;
  removeUpload: (id: string) => void;
  clearCompleted: () => void;
}

export const useUploadStore = create<UploadStore>((set) => ({
  uploads: {},
  
  addUpload: (item) => set((state) => ({
    uploads: {
      ...state.uploads,
      [item.id]: {
        ...item,
        progress: 0,
        status: 'uploading',
        createdAt: Date.now(),
      }
    }
  })),
  
  updateProgress: (id, progress) => set((state) => {
    if (!state.uploads[id]) return state;
    return {
      uploads: {
        ...state.uploads,
        [id]: {
          ...state.uploads[id],
          progress
        }
      }
    };
  }),
  
  updateStatus: (id, status, errorMessage) => set((state) => {
    if (!state.uploads[id]) return state;
    return {
      uploads: {
        ...state.uploads,
        [id]: {
          ...state.uploads[id],
          status,
          errorMessage
        }
      }
    };
  }),
  
  removeUpload: (id) => set((state) => {
    const newUploads = { ...state.uploads };
    const upload = newUploads[id];
    if (upload && upload.abortController) {
      upload.abortController.abort();
    }
    delete newUploads[id];
    return { uploads: newUploads };
  }),
  
  clearCompleted: () => set((state) => {
    const newUploads = { ...state.uploads };
    Object.keys(newUploads).forEach(key => {
      if (newUploads[key].status === 'success') {
        delete newUploads[key];
      }
    });
    return { uploads: newUploads };
  })
}));
