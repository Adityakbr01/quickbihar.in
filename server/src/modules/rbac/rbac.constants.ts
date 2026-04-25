import { RoleEnum, ModuleEnum, DomainEnum } from "./rbac.types";

export const ROLES = RoleEnum;
export const DOMAINS = DomainEnum;
export const MODULES = ModuleEnum;

export const PERMISSIONS = {
  // 🔹 CATEGORY (ADMIN ONLY)
  CREATE_CATEGORY: { code: "CREATE_CATEGORY", description: "Allows creating new product categories", module: ModuleEnum.CATEGORY },
  UPDATE_CATEGORY: { code: "UPDATE_CATEGORY", description: "Allows updating existing product categories", module: ModuleEnum.CATEGORY },
  DELETE_CATEGORY: { code: "DELETE_CATEGORY", description: "Allows deleting product categories", module: ModuleEnum.CATEGORY },
  VIEW_CATEGORY: { code: "VIEW_CATEGORY", description: "Allows viewing product categories", module: ModuleEnum.CATEGORY },

  // 🔹 ATTRIBUTE (ADMIN)
  CREATE_ATTRIBUTE: { code: "CREATE_ATTRIBUTE", description: "Allows creating new product attributes", module: ModuleEnum.ATTRIBUTE },
  UPDATE_ATTRIBUTE: { code: "UPDATE_ATTRIBUTE", description: "Allows updating existing product attributes", module: ModuleEnum.ATTRIBUTE },
  DELETE_ATTRIBUTE: { code: "DELETE_ATTRIBUTE", description: "Allows deleting product attributes", module: ModuleEnum.ATTRIBUTE },
  VIEW_ATTRIBUTE: { code: "VIEW_ATTRIBUTE", description: "Allows viewing product attributes", module: ModuleEnum.ATTRIBUTE },

  // 🔹 ROLE & PERMISSION MANAGEMENT
  ASSIGN_ROLE: { code: "ASSIGN_ROLE", description: "Allows assigning roles to users", module: ModuleEnum.USER },
  MANAGE_PERMISSION: { code: "MANAGE_PERMISSION", description: "Allows managing role permissions", module: ModuleEnum.USER },

  // 🔹 PRODUCT (GENERIC)
  CREATE_PRODUCT: { code: "CREATE_PRODUCT", description: "Allows creating new products", module: ModuleEnum.PRODUCT },
  UPDATE_PRODUCT: { code: "UPDATE_PRODUCT", description: "Allows updating existing products", module: ModuleEnum.PRODUCT },
  DELETE_PRODUCT: { code: "DELETE_PRODUCT", description: "Allows deleting products", module: ModuleEnum.PRODUCT },
  VIEW_PRODUCT: { code: "VIEW_PRODUCT", description: "Allows viewing products", module: ModuleEnum.PRODUCT },
  APPROVE_PRODUCT: { code: "APPROVE_PRODUCT", description: "Allows approving pending products", module: ModuleEnum.PRODUCT },
  REJECT_PRODUCT: { code: "REJECT_PRODUCT", description: "Allows rejecting products", module: ModuleEnum.PRODUCT },
  FEATURE_PRODUCT: { code: "FEATURE_PRODUCT", description: "Allows marking products as featured", module: ModuleEnum.PRODUCT },

  // 🔸 COUPON (NEW - ADMIN)
  CREATE_COUPON: { code: "CREATE_COUPON", description: "Allows creating discount coupons", module: ModuleEnum.COUPON },
  UPDATE_COUPON: { code: "UPDATE_COUPON", description: "Allows updating discount coupons", module: ModuleEnum.COUPON },
  DELETE_COUPON: { code: "DELETE_COUPON", description: "Allows deleting discount coupons", module: ModuleEnum.COUPON },
  VIEW_COUPON: { code: "VIEW_COUPON", description: "Allows viewing discount coupons", module: ModuleEnum.COUPON },
  APPLY_COUPON: { code: "APPLY_COUPON", description: "Allows applying coupons to orders", module: ModuleEnum.COUPON },
  VERIFY_COUPON: { code: "VERIFY_COUPON", description: "Allows verifying coupon validity", module: ModuleEnum.COUPON },

  // 🔹 BANNER (ADMIN)
  CREATE_BANNER: { code: "CREATE_BANNER", description: "Allows creating promotional banners", module: ModuleEnum.BANNER },
  UPDATE_BANNER: { code: "UPDATE_BANNER", description: "Allows updating promotional banners", module: ModuleEnum.BANNER },
  DELETE_BANNER: { code: "DELETE_BANNER", description: "Allows deleting promotional banners", module: ModuleEnum.BANNER },
  VIEW_BANNER: { code: "VIEW_BANNER", description: "Allows viewing promotional banners", module: ModuleEnum.BANNER },

  // 🔥 DOMAIN BASED PRODUCT CONTROL
  CREATE_CLOTHING_PRODUCT: { code: "CREATE_CLOTHING_PRODUCT", description: "Allows creating clothing products", module: ModuleEnum.PRODUCT, domain: DOMAINS.CLOTHING },
  CREATE_JEWELRY_PRODUCT: { code: "CREATE_JEWELRY_PRODUCT", description: "Allows creating jewelry products", module: ModuleEnum.PRODUCT, domain: DOMAINS.JEWELRY },
  CREATE_FOOD_PRODUCT: { code: "CREATE_FOOD_PRODUCT", description: "Allows creating food products", module: ModuleEnum.PRODUCT, domain: DOMAINS.FOOD },

  UPDATE_CLOTHING_PRODUCT: { code: "UPDATE_CLOTHING_PRODUCT", description: "Allows updating clothing products", module: ModuleEnum.PRODUCT, domain: DOMAINS.CLOTHING },
  UPDATE_JEWELRY_PRODUCT: { code: "UPDATE_JEWELRY_PRODUCT", description: "Allows updating jewelry products", module: ModuleEnum.PRODUCT, domain: DOMAINS.JEWELRY },
  UPDATE_FOOD_PRODUCT: { code: "UPDATE_FOOD_PRODUCT", description: "Allows updating food products", module: ModuleEnum.PRODUCT, domain: DOMAINS.FOOD },

  // 🔹 ORDER
  CREATE_ORDER: { code: "CREATE_ORDER", description: "Allows creating new orders", module: ModuleEnum.ORDER },
  VIEW_ORDER: { code: "VIEW_ORDER", description: "Allows viewing orders", module: ModuleEnum.ORDER },
  UPDATE_ORDER: { code: "UPDATE_ORDER", description: "Allows updating order status", module: ModuleEnum.ORDER },
  CANCEL_ORDER: { code: "CANCEL_ORDER", description: "Allows cancelling orders", module: ModuleEnum.ORDER },
  ASSIGN_ORDER: { code: "ASSIGN_ORDER", description: "Allows assigning orders to delivery personnel", module: ModuleEnum.ORDER },
  REFUND_ORDER: { code: "REFUND_ORDER", description: "Allows processing order refunds", module: ModuleEnum.ORDER },
  RETURN_APPROVE: { code: "RETURN_APPROVE", description: "Allows approving return requests", module: ModuleEnum.ORDER },
  RETURN_REJECT: { code: "RETURN_REJECT", description: "Allows rejecting return requests", module: ModuleEnum.ORDER },

  // 🔹 SELLER
  CREATE_SELLER: { code: "CREATE_SELLER", description: "Allows creating seller accounts", module: ModuleEnum.SELLER },
  VERIFY_SELLER: { code: "VERIFY_SELLER", description: "Allows verifying seller profiles", module: ModuleEnum.SELLER },
  VIEW_SELLER: { code: "VIEW_SELLER", description: "Allows viewing seller list", module: ModuleEnum.SELLER },
  REJECT_SELLER: { code: "REJECT_SELLER", description: "Allows rejecting seller applications", module: ModuleEnum.SELLER },
  BLOCK_SELLER: { code: "BLOCK_SELLER", description: "Allows blocking seller accounts", module: ModuleEnum.SELLER },
  VIEW_SELLER_DETAILS: { code: "VIEW_SELLER_DETAILS", description: "Allows viewing detailed seller information", module: ModuleEnum.SELLER },

  // 🔹 DELIVERY / Rider
  VERIFY_DELIVERY: { code: "VERIFY_DELIVERY", description: "Allows verifying delivery personnel", module: ModuleEnum.DELIVERY },
  REJECT_DELIVERY: { code: "REJECT_DELIVERY", description: "Allows rejecting delivery applications", module: ModuleEnum.DELIVERY },
  VIEW_DELIVERY: { code: "VIEW_DELIVERY", description: "Allows viewing delivery personnel list", module: ModuleEnum.DELIVERY },
  BLOCK_DELIVERY: { code: "BLOCK_DELIVERY", description: "Allows blocking delivery accounts", module: ModuleEnum.DELIVERY },
  ASSIGN_DELIVERY: { code: "ASSIGN_DELIVERY", description: "Allows assigning delivery tasks", module: ModuleEnum.DELIVERY },
  UPDATE_DELIVERY_STATUS: { code: "UPDATE_DELIVERY_STATUS", description: "Allows updating delivery progress", module: ModuleEnum.DELIVERY },

  // 🔹 STORE
  UPDATE_STORE_STATUS: { code: "UPDATE_STORE_STATUS", description: "Allows updating store operational status", module: ModuleEnum.STORE },
  VIEW_STORE: { code: "VIEW_STORE", description: "Allows viewing store details", module: "STORE" },
  CREATE_STORE: { code: "CREATE_STORE", description: "Allows creating new stores", module: ModuleEnum.STORE },
  UPDATE_STORE: { code: "UPDATE_STORE", description: "Allows updating store info", module: ModuleEnum.STORE },
  DELETE_STORE: { code: "DELETE_STORE", description: "Allows deleting stores", module: ModuleEnum.STORE },
  VERIFY_STORE: { code: "VERIFY_STORE", description: "Allows verifying store profiles", module: "STORE" },

  // 🔹 USER
  VIEW_USER: { code: "VIEW_USER", description: "Allows viewing user profiles", module: ModuleEnum.USER },
  BLOCK_USER: { code: "BLOCK_USER", description: "Allows blocking user accounts", module: "USER" },

  // 🔹 REVIEW
  CREATE_REVIEW: { code: "CREATE_REVIEW", description: "Allows submitting product reviews", module: ModuleEnum.REVIEW },
  DELETE_REVIEW: { code: "DELETE_REVIEW", description: "Allows deleting product reviews", module: ModuleEnum.REVIEW },

  // 🔹 PAYMENT
  HANDLE_PAYMENT: { code: "HANDLE_PAYMENT", description: "Allows handling payment transactions", module: ModuleEnum.PAYMENT },
  VIEW_PAYOUT: { code: "VIEW_PAYOUT", description: "Allows viewing payout history", module: "PAYMENT" },
  PROCESS_PAYOUT: { code: "PROCESS_PAYOUT", description: "Allows processing seller payouts", module: "PAYMENT" },
  VIEW_TRANSACTIONS: { code: "VIEW_TRANSACTIONS", description: "Allows viewing all transactions", module: ModuleEnum.PAYMENT },

  // 🔹 ANALYTICS
  VIEW_SELLER_ANALYTICS: { code: "VIEW_SELLER_ANALYTICS", description: "Allows viewing seller-specific analytics", module: ModuleEnum.ANALYTICS },
  VIEW_PLATFORM_ANALYTICS: { code: "VIEW_PLATFORM_ANALYTICS", description: "Allows viewing platform-wide analytics", module: ModuleEnum.ANALYTICS },
} as const;
