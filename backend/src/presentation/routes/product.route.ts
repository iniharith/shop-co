/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { Router } from "express";
import ProductController from "../controllers/product.controller";
import { forceSeedProducts } from "../../shared/scripts/seed";

const router = Router();



router.get("/seed", async (req, res) => {
    const success = await forceSeedProducts();
    if (success) res.json({ message: "Seeded new printing products successfully" });
    else res.status(500).json({ message: "Failed to seed products" });
});

router.get("/", ProductController.getAllProducts.bind(ProductController));

router.get("/search", ProductController.searchProducts.bind(ProductController));

router.get("/category/:category", ProductController.getProductByCategory.bind(ProductController));

router.get("/categories", ProductController.getAvailableCategories.bind(ProductController));

router.get("/filter", ProductController.filterProducts.bind(ProductController));

router.get("/slug/:slug", ProductController.getProductBySlug.bind(ProductController));

router.get("/:id", ProductController.getProductById.bind(ProductController));




export default router;
