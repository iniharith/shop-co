/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Types } from "mongoose";
import { CartRepository } from "../../../infrastructure/db/repositories/cart.repository";
import { ProductRepository } from "../../../infrastructure/db/repositories/product.repository";
import { IProduct } from "../../../domain/interfaces/product.interface";
import { IProductConfiguration } from "../../../domain/interfaces/cart.interface";
import { computeProductPricing } from "../../../shared/pricing/product-pricing.service";
export class CartUsecase {
    private readonly cartRepository: CartRepository;
    private readonly productRepository: ProductRepository;

    constructor() {
        this.cartRepository = new CartRepository();
        this.productRepository = new ProductRepository();
    }

    async addProductToCart(userId: string, productId: Types.ObjectId, size: string, quantity: number, artworkUrl?: string, configuration?: IProductConfiguration, _configurationKey?: string) {
        if (!Number.isInteger(quantity) || quantity < 1) throw new Error("Quantity must be a positive integer");
        if (typeof size !== 'string' || !size.trim()) throw new Error("Size is required");
        const product = await this.productRepository.findById(productId as unknown as string);
        if (!product) {
            throw new Error("Product not found");
        }
        const fulfillmentSize = configuration?.fulfillmentSize || size.split('|')[0].trim();
        if (!product.sizes.some((candidate) => candidate.size === fulfillmentSize)) {
            throw new Error("Selected size is not available for this product");
        }
        const normalizedConfiguration = configuration ? { ...configuration, fulfillmentSize } : undefined;
        const storedProductId = (product._id as unknown as Types.ObjectId).toString();
        const configurationKey = normalizedConfiguration ? JSON.stringify(normalizedConfiguration) : size;
        const pricing = computeProductPricing(product, quantity, normalizedConfiguration);
        const cart = await this.cartRepository.getCartByUserId(userId);

        if (!cart) {
            return await this.cartRepository.upsertCart(userId, storedProductId, size, quantity, artworkUrl, normalizedConfiguration, configurationKey, pricing.unitPrice, pricing.fixedPrice, pricing.lineTotal, pricing.pricingVersion);
        }

        const productExist = cart.items.find((item) => item.product._id.toString() === storedProductId && (item.configurationKey || item.size) === configurationKey);

        if (productExist) {
            productExist.quantity = quantity;
            productExist.unitPrice = pricing.unitPrice;
            productExist.fixedPrice = pricing.fixedPrice;
            productExist.lineTotal = pricing.lineTotal;
            productExist.pricingVersion = pricing.pricingVersion;
        } else {
            cart.items.push({
                product: storedProductId as unknown as any,
                size,
                quantity,
                artworkUrl,
                configuration: normalizedConfiguration,
                configurationKey,
                unitPrice: pricing.unitPrice,
                fixedPrice: pricing.fixedPrice,
                lineTotal: pricing.lineTotal,
                pricingVersion: pricing.pricingVersion,
            });
        }

        return await cart.save();
    }

    async removeProductFromCart(userId: string, productId: Types.ObjectId, size: string, configurationKey?: string) {
        const cart = await this.cartRepository.getCartByUserId(userId);
        if (!cart) {
            throw new Error("Cart not found");
        }
        const product = await this.productRepository.findById(productId as unknown as string);
        const storedProductId = product ? (product._id as unknown as Types.ObjectId).toString() : (productId as unknown as string);
        cart.items = cart.items.filter((item) => item.product._id.toString() !== storedProductId || (configurationKey ? item.configurationKey !== configurationKey : item.size !== size));
        return await cart.save();
    }

    async getCart(userId: string) {
        return await this.cartRepository.getCartByUserId(userId);
    }

    async clearCart(userId: string) {
        return await this.cartRepository.clearCart(userId);
    }

    async updateCartItem(userId: string, productId: Types.ObjectId, size: string, quantity: number, configurationKey?: string) {
        if (!Number.isInteger(quantity) || quantity < 1) throw new Error("Quantity must be a positive integer");

        const cart = await this.cartRepository.getCartByUserId(userId);
        if (!cart) {
            throw new Error("Cart not found");
        }
        const product = await this.productRepository.findById(productId as unknown as string);
        const storedProductId = product ? (product._id as unknown as Types.ObjectId).toString() : (productId as unknown as string);
        const item = cart.items.find((candidate) => candidate.product._id.toString() === storedProductId && (configurationKey ? candidate.configurationKey === configurationKey : candidate.size === size));
        if (!item) throw new Error("Cart item not found");
        item.quantity = quantity;
        if (!product) {
            const fallbackUnitPrice = item.unitPrice ?? 0;
            const fallbackFixedPrice = item.fixedPrice ?? 0;
            item.unitPrice = fallbackUnitPrice;
            item.fixedPrice = fallbackFixedPrice;
            item.lineTotal = fallbackUnitPrice * quantity + fallbackFixedPrice;
            return await cart.save();
        }
        const pricing = computeProductPricing(product as IProduct, quantity, item.configuration);
        item.unitPrice = pricing.unitPrice;
        item.fixedPrice = pricing.fixedPrice;
        item.lineTotal = pricing.lineTotal;
        item.pricingVersion = pricing.pricingVersion;
        return await cart.save();
    }

    async getCartTotal(userId: string) {
        const cart = await this.cartRepository.getCartByUserId(userId);
        return cart?.items.reduce((acc, item) => acc + (item.lineTotal ?? item.quantity * item.product.price), 0);
    }
}

export default new CartUsecase();
