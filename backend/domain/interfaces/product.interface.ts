/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Document } from 'mongoose';

export interface ISize {
  stock: number;
  size: string;
  lowStockThreshold?: number;
  images?: string[];
}

export interface IProduct {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  sizes: ISize[];
  images: string[];
  printingOptions?: unknown[];
  sections?: string[];
  slug?: string;
  status?: 'draft' | 'published';
  seoTitle?: string;
  seoDescription?: string;
  specifications?: {
    material?: string;
    frame?: string;
    dimensions?: string;
    weight?: string;
    finish?: string;
    color?: string;
    customFields?: Record<string, string>;
  };
  packageContents?: string[];
  productionTurnaround?: {
    standardDays?: number;
    expressDays?: number;
    notes?: string;
  };
  warrantyInfo?: string;
  catalogId?: string;
  isDelete?: boolean;
  archivedAt?: Date | null;
  rating?: number;
  viewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductDocument extends IProduct, Document {}
