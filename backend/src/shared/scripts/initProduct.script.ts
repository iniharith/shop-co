/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { ProductRepository } from "../../infrastructure/db/repositories/product.repository";

const data = [
    { name: 'Yellow Jacket', description: 'Bold yellow jacket', price: 65, category: 'jacket', sizes: [{ size: 'L', stock: 4 }], images: ['/yellow-jacket.webp'], rating: 4 },
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
