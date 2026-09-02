/**
 * Coded by Harith
 * Kampungcetak ®
 * 
 * Product content enrichment script.
 * Reads content from product-content.json and upserts by catalogId.
 * Run with: npm run seed:content
 */
import { config } from 'dotenv';
import connectDB from '../../config/db.config';
import ProductModel from '../../infrastructure/db/models/product.model';
import * as fs from 'fs';
import * as path from 'path';

interface ProductContent {
    catalogId: string;
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
    installationInstructions?: string;
    productionTurnaround?: {
        standardDays?: number;
        expressDays?: number;
        notes?: string;
    };
    warrantyInfo?: string;
    customerPhotos?: string[];
}

const main = async () => {
    config();
    await connectDB();

    const contentPath = path.resolve(__dirname, '../../../product-content.json');
    if (!fs.existsSync(contentPath)) {
        console.error('Content file not found:', contentPath);
        console.log('Create product-content.json from the template at backend/src/shared/scripts/product-content.template.json');
        process.exit(1);
    }

    const contentData: ProductContent[] = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
    let updated = 0;
    let skipped = 0;

    for (const content of contentData) {
        const result = await ProductModel.updateOne(
            { catalogId: content.catalogId },
            { $set: content }
        );
        if (result.modifiedCount > 0) {
            updated++;
        } else {
            skipped++;
        }
    }

    console.log(`Content enrichment: ${updated} updated, ${skipped} skipped (not found or no changes).`);
    process.exit(0);
};

main().catch((error) => {
    console.error('Content enrichment failed:', error);
    process.exit(1);
});