/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { create } from "zustand";

interface FilterState {
  serviceCategories: string[];
  turnarounds: string[];
  formats: string[];
  materials: string[];
  priceRange: [number, number];
}

interface FilterActions {
  setServiceCategories: (categories: string[]) => void;
  setTurnarounds: (turnarounds: string[]) => void;
  setFormats: (formats: string[]) => void;
  setMaterials: (materials: string[]) => void;
  setPriceRange: (priceRange: [number, number]) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState & FilterActions>((set) => ({
  serviceCategories: [],
  turnarounds: [],
  formats: [],
  materials: [],
  priceRange: [0, 1000],

  setServiceCategories: (serviceCategories: string[]) => set({ serviceCategories }),
  setTurnarounds: (turnarounds: string[]) => set({ turnarounds }),
  setFormats: (formats: string[]) => set({ formats }),
  setMaterials: (materials: string[]) => set({ materials }),
  setPriceRange: (priceRange: [number, number]) => set({ priceRange }),
  resetFilters: () => set({ 
    serviceCategories: [], 
    turnarounds: [], 
    formats: [], 
    materials: [], 
    priceRange: [0, 1000] 
  }),
}));

