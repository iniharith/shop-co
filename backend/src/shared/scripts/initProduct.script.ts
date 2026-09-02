/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { ProductRepository } from "../../infrastructure/db/repositories/product.repository";
import { IProduct } from "../../domain/interfaces/product.interface";

const data: Partial<IProduct>[] = [
];





const initProduct = async () => {
    const productRepository = new ProductRepository();
    if (await productRepository.hasAny()) {
        console.log("🎉 Products already initialized");



        return;
    }


    const products = await productRepository.createMany(data);
    console.log(products.length);
    console.log("🎉 Products initialized successfully");
}

export default initProduct;
