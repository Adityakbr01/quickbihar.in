import mongoose, { Types } from "mongoose";
import fs from "fs";
import { ENV } from "@/config/env.config";
import { uploadToImageKit } from "@/utils/imagekit.util";
import { Mall } from "@/modules/common/mall/mall.model";
import { Store } from "@/modules/common/store/store.model";

async function uploadLocalImage(
    localPath: string,
    fileName: string,
    folder: string
): Promise<{ url: string; fileId: string }> {
    if (!fs.existsSync(localPath)) {
        throw new Error(`Local file not found: ${localPath}`);
    }
    const buffer = fs.readFileSync(localPath);
    console.log(`Reading ${localPath} (${buffer.length} bytes)...`);
    const uploaded = await uploadToImageKit(buffer, fileName, folder);
    console.log(`Uploaded to ImageKit [${folder}]: ${uploaded.url}`);
    return uploaded;
}

async function main() {
    console.log("=================================================");
    console.log("📸 UPLOADING ADITYA FASHION MALL IMAGES & UPDATING DB");
    console.log("=================================================");

    await mongoose.connect(ENV.MONGODB_URI);
    console.log("Connected to MongoDB Atlas.");

    const brainDir = "C:\\Users\\ADITYA\\.gemini\\antigravity-ide\\brain\\e1f93365-9fa7-443f-8df8-481ce0dfb713";

    const extPath = `${brainDir}\\aditya_mall_ext_1789053525051.jpg`;
    const intPath = `${brainDir}\\aditya_mall_int_1789053554577.jpg`;
    const wingPath = `${brainDir}\\aditya_mall_wing_1789053578790.jpg`;

    console.log("\n1. Uploading images to ImageKit...");
    const uploadedExt = await uploadLocalImage(extPath, "aditya_fashion_mall_exterior.jpg", "malls/covers");
    const uploadedInt = await uploadLocalImage(intPath, "aditya_fashion_mall_atrium.jpg", "malls/images");
    const uploadedWing = await uploadLocalImage(wingPath, "aditya_fashion_mall_showroom.jpg", "malls/images");

    console.log("\n2. Updating Mall in MongoDB Atlas...");
    const mall = await Mall.findOneAndUpdate(
        { slug: "aditya-fashion-mall" },
        {
            $set: {
                coverImageUrl: uploadedExt.url,
                coverImagePublicId: uploadedExt.fileId,
                images: [
                    { url: uploadedExt.url, fileId: uploadedExt.fileId },
                    { url: uploadedInt.url, fileId: uploadedInt.fileId },
                    { url: uploadedWing.url, fileId: uploadedWing.fileId },
                ],
            },
        },
        { returnDocument: "after" }
    );

    if (!mall) {
        throw new Error("Aditya Fashion Mall not found in DB!");
    }
    console.log(`✅ Mall Updated: ${mall.name}`);
    console.log(`Cover Image: ${mall.coverImageUrl}`);
    console.log(`Total Mall Gallery Images: ${mall.images?.length}`);

    console.log("\n3. Updating Store banner & storeImages...");
    const sellerUserId = new Types.ObjectId("6a9c2739a9693d1c9e7603da");
    const store = await Store.findOneAndUpdate(
        { sellerId: sellerUserId },
        {
            $set: {
                bannerUrl: uploadedExt.url,
                storeImages: [uploadedExt.url, uploadedInt.url, uploadedWing.url],
            },
        },
        { returnDocument: "after" }
    );
    if (store) {
        console.log(`✅ Store Updated: ${store.name}`);
    }

    console.log("=================================================");
    console.log("🎉 ALL ADITYA FASHION MALL IMAGES UPDATED 100%!");
    console.log("=================================================");

    await mongoose.disconnect();
}

main().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
});
