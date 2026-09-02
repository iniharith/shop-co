/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { FilterQuery } from "mongoose";
import { IProduct, IProductDocument } from "../../../domain/interfaces/product.interface";
import ProductModel from "../models/product.model";
import { BaseRepository } from "./base.repository";

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
        return await this.model.findOne({ name, isDelete: false });
    }

    async findByCategory(category: string) {
        return await this.model.find({ isDelete: false, $or: [{ category }, { sections: category }] });
    }

    async findById(id: string) {
        if (typeof id === 'string' && /^prod-/i.test(id)) {
            return await this.model.findOne({ catalogId: id, isDelete: false });
        }
        return await this.model.findOne({ _id: id, isDelete: false });
    }

    async findByCatalogId(catalogId: string) {
        return await this.model.findOne({ catalogId, isDelete: false });
    }


    async filterProducts(filter: FilterQuery<IProductDocument>, limit: number, page: number) {
        return await this.model.find({ ...filter, isDelete: false }).limit(limit).skip(limit * (page - 1));
    }


    async searchProducts(query: string) {
        return await this.model.find({
            isDelete: false,
            $or: [
                { name: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
                { category: { $regex: query, $options: "i" } },
            ]
        });
    }

    async getCategories() {
        return await this.model.find({ isDelete: false }).distinct("category");
    }

    async updateProductStockBySize(productId: string, size: string, quantityChange: number): Promise<IProductDocument | null> {
        const sizeCondition = quantityChange < 0
            ? { $elemMatch: { size, stock: { $gte: -quantityChange } } }
            : { $elemMatch: { size } };
        return await this.model.findOneAndUpdate(
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
    }


}

export default new ProductRepository();
