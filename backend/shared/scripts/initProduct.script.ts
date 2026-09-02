/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { ProductRepository } from "../../infrastructure/db/repositories/product.repository";

const data = [
];





const initProduct = async () => {
    const productRepository = new ProductRepository();
    const productList = await productRepository.findAll();
    if (productList.length > 0) {
        console.log("🎉 Products already initialized");



        return;
    }


    const products = await productRepository.createMany(data);
    console.log(products);
    console.log(products.length);
    console.log("🎉 Products initialized successfully");
}

export default initProduct;
