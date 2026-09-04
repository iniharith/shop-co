/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { FilterQuery } from "mongoose";
import { IProduct, IProductDocument } from "../../../domain/interfaces/product.interface";
import ProductModel from "../models/product.model";
import { BaseRepository } from "./base.repository";
import { StockAdjustment } from "../../../domain/entities/StockAdjustment";

export interface StockAdjustmentContext {
    reason: string;
    source: 'admin' | 'order' | 'rollback' | 'initial';
    actorId?: string;
    actorName?: string;
    referenceId?: string;
}

export class ProductRepository extends BaseRepository<IProductDocument> {
    constructor() {
        super(ProductModel);
    }

    async createMany(products: Partial<IProduct>[]) {
        return await this.model.insertMany(products);
    }

    async hasAny(): Promise<boolean> {
        return Boolean(await this.model.exists({}));
    }

    async findByName(name: string) {
        return await this.model.findOne({ name, isDelete: false, status: { $ne: 'draft' } });
    }

    async findByCategory(category: string) {
        return await this.model.find({ isDelete: false, status: { $ne: 'draft' }, $or: [{ category }, { sections: category }] });
    }

    async findById(id: string) {
        if (typeof id === 'string' && /^prod-/i.test(id)) {
            return await this.model.findOne({ catalogId: id, isDelete: false, status: { $ne: 'draft' } });
        }
        return await this.model.findOne({ _id: id, isDelete: false, status: { $ne: 'draft' } });
    }

    async findBySlug(slug: string) {
        return await this.model.findOne({ slug, isDelete: false, status: { $ne: 'draft' } });
    }

    async incrementViewCount(productId: string) {
        return await this.model.updateOne({ _id: productId, isDelete: false, status: { $ne: 'draft' } }, { $inc: { viewCount: 1 } });
    }

    async findByCatalogId(catalogId: string) {
        return await this.model.findOne({ catalogId, isDelete: false, status: { $ne: 'draft' } });
    }


    async filterProducts(filter: FilterQuery<IProductDocument>, limit: number, page: number) {
        return await this.model.find({ ...filter, isDelete: false, status: { $ne: 'draft' } }).limit(limit).skip(limit * (page - 1));
    }


    async searchProducts(query: string) {
        return await this.model.find({
            isDelete: false,
            status: { $ne: 'draft' },
            $or: [
                { name: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
                { category: { $regex: query, $options: "i" } },
            ]
        });
    }

    async getCategories() {
        return await this.model.find({ isDelete: false, status: { $ne: 'draft' } }).distinct("category");
    }

    async updateProductStockBySize(productId: string, size: string, quantityChange: number, context?: StockAdjustmentContext): Promise<IProductDocument | null> {
        const sizeCondition = quantityChange < 0
            ? { $elemMatch: { size, stock: { $gte: -quantityChange } } }
            : { $elemMatch: { size } };
        const product = await this.model.findOneAndUpdate(
            {
                _id: productId,
                sizes: sizeCondition,
            },
            {
                $inc: { 'sizes.$.stock': quantityChange }
            },
            {
                new: true
            }
        );
        if (product && quantityChange !== 0 && context) {
            const afterStock = product.sizes.find(item => item.size === size)?.stock;
            if (typeof afterStock === 'number') {
                await StockAdjustment.create({
                    productId: product._id,
                    productName: product.name,
                    size,
                    delta: quantityChange,
                    beforeStock: afterStock - quantityChange,
                    afterStock,
                    ...context,
                }).catch(error => console.error('Failed to record stock adjustment:', error));
            }
        }
        return product;
    }

    async setProductStockBySize(productId: string, size: string, stock: number, context: StockAdjustmentContext): Promise<IProductDocument | null> {
        const current = await this.model.findOne({ _id: productId, sizes: { $elemMatch: { size } } }).select({ name: 1, sizes: 1 });
        const beforeStock = current?.sizes.find(item => item.size === size)?.stock;
        if (typeof beforeStock !== 'number') return null;
        const product = await this.model.findOneAndUpdate(
            { _id: productId, sizes: { $elemMatch: { size, stock: beforeStock } } },
            { $set: { 'sizes.$.stock': stock } },
            { new: true },
        );
        if (!product) return null;
        if (stock !== beforeStock) {
            await StockAdjustment.create({
                productId: product._id,
                productName: product.name,
                size,
                delta: stock - beforeStock,
                beforeStock,
                afterStock: stock,
                ...context,
            }).catch(error => console.error('Failed to record stock adjustment:', error));
        }
        return product;
    }


}

export default new ProductRepository();
