import { Document, Types } from 'mongoose';
import { IProduct, IProductDocument } from './product.interface';

export interface ICartItem {
  product: IProductDocument ; 
  size: string;
  quantity: number;
  artworkUrl?: string;
}

export interface ICart {
  userId: Types.ObjectId; 
  items: ICartItem[];
  totalPrice: number;
}

export interface ICartDocument extends ICart, Document {}
