import mongoose from "mongoose";
import { ENV } from "../config/env.config";
import { DeliveryBoy } from "../modules/deliveryBoy/delivery.model";
import { Role } from "../modules/rbac/rbac.model";
import { RoleEnum } from "../modules/rbac/rbac.types";
import { Seller } from "../modules/seller/seller.model";
import { User } from "../modules/user/user.model";

async function roleId(name: RoleEnum) {
  const role = await Role.findOne({ name }).lean();
  if (!role?._id) throw new Error(`Role ${name} not found. Run bun run rbac:seed first.`);
  return role._id;
}

async function repairPartnerRoles() {
  await mongoose.connect(ENV.MONGODB_URI);

  const [userRoleId, sellerRoleId, deliveryRoleId] = await Promise.all([
    roleId(RoleEnum.USER),
    roleId(RoleEnum.SELLER),
    roleId(RoleEnum.DELIVERY),
  ]);

  const approvedSellers = await Seller.find({ status: "APPROVED", isVerified: true }).select("userId").lean();
  const approvedRiders = await DeliveryBoy.find({ status: "APPROVED", isVerified: true }).select("userId").lean();

  const sellerUserIds = approvedSellers.map((profile: any) => profile.userId).filter(Boolean);
  const riderUserIds = approvedRiders.map((profile: any) => profile.userId).filter(Boolean);

  const [sellerResult, riderResult] = await Promise.all([
    sellerUserIds.length
      ? User.updateMany({ _id: { $in: sellerUserIds } }, { $set: { roleId: sellerRoleId } })
      : Promise.resolve({ modifiedCount: 0 }),
    riderUserIds.length
      ? User.updateMany({ _id: { $in: riderUserIds } }, { $set: { roleId: deliveryRoleId } })
      : Promise.resolve({ modifiedCount: 0 }),
  ]);

  const defaultResult = await User.updateMany(
    { $or: [{ roleId: null }, { roleId: { $exists: false } }] },
    { $set: { roleId: userRoleId } },
  );

  console.log(JSON.stringify({
    sellerUsersRepaired: sellerResult.modifiedCount || 0,
    deliveryUsersRepaired: riderResult.modifiedCount || 0,
    defaultUsersRepaired: defaultResult.modifiedCount || 0,
  }, null, 2));

  await mongoose.disconnect();
}

repairPartnerRoles()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  });

