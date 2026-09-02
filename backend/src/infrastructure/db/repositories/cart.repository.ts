/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { ICartDocument } from "../../../domain/interfaces/cart.interface";
import { ICart, IProductConfiguration } from "../../../domain/interfaces/cart.interface";
import CartModel from "../models/cart.model";

export class CartRepository {
    async createCart(cart: ICart): Promise<ICartDocument> {
        return await CartModel.create(cart);
    }

    async upsertCart(userId: string, productId: string, size: string, quantity: number, artworkUrl: string | undefined, configuration: IProductConfiguration | undefined, configurationKey: string, unitPrice: number, fixedPrice = 0, lineTotal?: number, pricingVersion = 'catalog-v1'): Promise<ICartDocument> {
        const resolvedLineTotal = lineTotal ?? unitPrice * quantity;
        return await CartModel.findOneAndUpdate(
            { userId },
            { $push: { items: { product: productId, size, quantity, artworkUrl, configuration, configurationKey, unitPrice, fixedPrice, lineTotal: resolvedLineTotal, pricingVersion } } },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        ).populate('items.product');
    }

    async getCartByUserId(userId: string): Promise<ICartDocument | null> {
        return await CartModel.findOne({ userId }).populate('items.product');
    }

    async clearCart(userId: string): Promise<ICartDocument | null> {
        return await CartModel.findOneAndUpdate({ userId }, { items: [] }, { new: true }).populate('items.product');
    }
}

export default new CartRepository();
