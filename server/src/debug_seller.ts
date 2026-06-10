import mongoose from "mongoose";
import { Product } from "./modules/products/product.model";
import { User } from "./modules/user/user.model";
import { Role } from "./modules/rbac/rbac.model";
import { ENV } from "./config/env.config";

async function main() {
    await mongoose.connect(ENV.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const users = await User.find({});
    console.log(`Found ${users.length} total users in DB.`);
    
    for (const user of users) {
        console.log(`User ID: ${user._id}, Name: ${user.fullName}, RoleRef: ${user.roleId}`);
    }

    const products = await Product.find({ isDeleted: false }).limit(5);
    console.log(`\nFound ${products.length} active products in DB:`);
    for (const prod of products) {
        console.log(`Product ID: ${prod._id}, Title: ${prod.title}, SellerId: ${prod.sellerId} (type: ${typeof prod.sellerId})`);
    }

    await mongoose.disconnect();
}

main().catch(console.error);
