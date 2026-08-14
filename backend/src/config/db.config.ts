/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { config } from "dotenv";
import mongoose from "mongoose";
import dns from "dns";

// Bypass Telekom Malaysia's broken IPv6 DNS by forcing Google's DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

const sanitizeMongoUri = (uri: string): string => {
    const isLocal = uri.includes('localhost') || uri.includes('127.0.0.1');
    if (uri.includes('directConnection=true') && !isLocal) {
        console.warn(
            "[Mongo] Stripping directConnection=true from MONGO_URI: on Atlas it pins the driver to one node (often a secondary) and breaks writes with 'not primary'."
        );
        const cleaned = uri
            .replace('?directConnection=true&', '?')
            .replace('?directConnection=true', '')
            .replace('&directConnection=true', '');
        if (!cleaned.startsWith('mongodb+srv://') && (cleaned.match(/,/g) || []).length < 2) {
            console.warn(
                "[Mongo] MONGO_URI now targets a single node with no replicaSet. If that node is a secondary, writes will still fail. Use the full replica-set string from Atlas (all 3 hosts) or the SRV URI."
            );
        }
        return cleaned;
    }
    return uri;
};

config();
const connectDB = async () => {
    try {
        const mongoURI = sanitizeMongoUri(process.env.MONGO_URI || 'mongodb://abshar:123@localhost:27017/');
        await mongoose.connect(mongoURI, {
            dbName: 'shop-co',
            authSource: "admin",
            family: 4, // Force IPv4 to bypass dual-stack DNS issues
            serverSelectionTimeoutMS: 5000,
            readPreference: 'secondaryPreferred', // reads from secondaries, writes always hit the primary
        });

        console.log("MongoDB connected");
    } catch (err) {
        console.error("MongoDB connection error 🔴:", err);
        process.exit(1);
    }
};

export default connectDB;
