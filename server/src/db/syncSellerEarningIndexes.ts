import mongoose from "mongoose";
import { ENV } from "../config/env.config";
import { SellerEarning } from "../modules/seller/sellerPanel.model";

async function syncSellerEarningIndexes() {
  await mongoose.connect(ENV.MONGODB_URI);
  const result = await SellerEarning.syncIndexes();
  console.log(JSON.stringify({
    collection: SellerEarning.collection.name,
    result,
  }, null, 2));
}

syncSellerEarningIndexes()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  });
