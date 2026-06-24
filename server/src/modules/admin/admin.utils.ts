import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { User } from "../user/user.model";
import { Product } from "../products/product.model";
import { Coupon } from "../coupon/coupon.model";
import { Banner } from "../banner/banner.model";
import { SizeChart } from "../sizeChart/sizeChart.model";
import {
  SellerCategoryRequest,
  SellerNotification,
} from "../seller/sellerPanel.model";
import { Store } from "../store/store.model";
import {
  AdminSystemConfig,
  Announcement,
  BlogPost,
  CMSPage,
  FAQ,
  FlashSale,
  ShippingProvider,
  Warehouse,
} from "./adminFull.model";

export const userProjection = "-password -refreshToken -fcmToken";
export const reservedPayoutStatuses = ["PENDING", "PROCESSING"];

export const walletOf = (profile: any) => {
  if (!profile.wallet) {
    profile.wallet = {
      availableBalance: 0,
      pendingPayoutBalance: 0,
      lifetimeEarnings: 0,
    };
  }
  return profile.wallet;
};

export const reserveWalletForCreatedPayout = (
  wallet: any,
  amountInput: number,
  status: string,
) => {
  const amount = Number(amountInput || 0);
  if (reservedPayoutStatuses.includes(status)) {
    wallet.availableBalance = Math.max(
      0,
      (wallet.availableBalance || 0) - amount,
    );
    wallet.pendingPayoutBalance = (wallet.pendingPayoutBalance || 0) + amount;
  } else if (status === "PAID") {
    wallet.availableBalance = Math.max(
      0,
      (wallet.availableBalance || 0) - amount,
    );
  }
};

export const applyPayoutStatusWalletTransition = (
  wallet: any,
  amountInput: number,
  previousStatus: string,
  nextStatus: string,
) => {
  const amount = Number(amountInput || 0);
  const wasReserved = reservedPayoutStatuses.includes(previousStatus);
  const isReserved = reservedPayoutStatuses.includes(nextStatus);
  const isTerminal = ["PAID", "FAILED"].includes(nextStatus);

  if (wasReserved && isTerminal) {
    wallet.pendingPayoutBalance = Math.max(
      0,
      (wallet.pendingPayoutBalance || 0) - amount,
    );
    if (nextStatus === "FAILED") {
      wallet.availableBalance = (wallet.availableBalance || 0) + amount;
    }
  }

  if (!wasReserved && isReserved) {
    wallet.availableBalance = Math.max(
      0,
      (wallet.availableBalance || 0) - amount,
    );
    wallet.pendingPayoutBalance = (wallet.pendingPayoutBalance || 0) + amount;
  }

  if (!wasReserved && nextStatus === "PAID") {
    wallet.availableBalance = Math.max(
      0,
      (wallet.availableBalance || 0) - amount,
    );
  }
};

export const roleNameOf = (role: any) => role?.name || role || "USER";

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const managementCatalog = [
  {
    id: "core-management",
    title: "Core Management",
    features: [
      {
        name: "Order Management",
        status: "ACTIVE",
        module: "order",
        route: "/api/v1/orders",
        note: "Order creation, user orders, admin order listing, and status updates exist.",
      },
      {
        name: "Product Management",
        status: "ACTIVE",
        module: "products",
        route: "/api/v1/products",
        note: "Product CRUD, public listing, trending, and similar products exist.",
      },
      {
        name: "Category Management",
        status: "ACTIVE",
        module: "category",
        route: "/api/v1/categories",
        note: "Public and admin category management exists.",
      },
      {
        name: "Coupon & Discount Management",
        status: "ACTIVE",
        module: "coupon",
        route: "/api/v1/coupons",
        note: "Coupon CRUD and validation exist.",
      },
      {
        name: "Banner Management",
        status: "ACTIVE",
        module: "banner",
        route: "/api/v1/banners",
        note: "Banner CRUD, impressions, clicks, and placements exist.",
      },
      {
        name: "Size Chart Management",
        status: "ACTIVE",
        module: "sizeChart",
        route: "/api/v1/size-charts",
        note: "Size chart CRUD exists.",
      },
      {
        name: "User Management",
        status: "ACTIVE",
        module: "user/admin",
        route: "/api/v1/admin/people",
        note: "Admin can search users, filter roles, and ban/unban.",
      },
      {
        name: "Seller Management",
        status: "ACTIVE",
        module: "seller/admin",
        route: "/api/v1/admin/people?role=SELLER",
        note: "Admin can approve/reject sellers and manage mall assignment.",
      },
      {
        name: "Mall Management",
        status: "ACTIVE",
        module: "mall/admin",
        route: "/api/v1/admin/malls",
        note: "Admin can create malls, feature top malls, and approve seller mall requests.",
      },
    ],
  },
  {
    id: "store-configuration",
    title: "Store Configuration",
    features: [
      {
        name: "Store Name",
        status: "ACTIVE",
        module: "appConfig",
        route: "/api/v1/app-config",
        note: "Managed in app config store settings.",
      },
      {
        name: "App Title",
        status: "ACTIVE",
        module: "appConfig",
        route: "/api/v1/app-config",
        note: "Managed in app config store settings.",
      },
      {
        name: "Meta Title",
        status: "ACTIVE",
        module: "appConfig",
        route: "/api/v1/app-config",
        note: "Managed in SEO settings.",
      },
      {
        name: "Meta Description",
        status: "ACTIVE",
        module: "appConfig",
        route: "/api/v1/app-config",
        note: "Managed in SEO settings.",
      },
      {
        name: "Meta Keywords",
        status: "ACTIVE",
        module: "appConfig",
        route: "/api/v1/app-config",
        note: "Managed as an array of SEO keywords.",
      },
      {
        name: "Free Shipping Threshold",
        status: "ACTIVE",
        module: "appConfig",
        route: "/api/v1/app-config",
        note: "Managed in shipping settings.",
      },
      {
        name: "Shipping Fee Configuration",
        status: "ACTIVE",
        module: "appConfig",
        route: "/api/v1/app-config",
        note: "Managed in shipping settings.",
      },
      {
        name: "Tax Configuration",
        status: "ACTIVE",
        module: "appConfig",
        route: "/api/v1/app-config",
        note: "Tax enable/rate/inclusive settings added.",
      },
      {
        name: "Currency Settings",
        status: "ACTIVE",
        module: "appConfig",
        route: "/api/v1/app-config",
        note: "Currency code and symbol settings added.",
      },
      {
        name: "Delivery Settings",
        status: "ACTIVE",
        module: "appConfig",
        route: "/api/v1/app-config",
        note: "Default radius, minimum order, and ETA settings added.",
      },
      {
        name: "Return & Refund Policy",
        status: "ACTIVE",
        module: "refundPolicy/appConfig",
        route: "/api/v1/refund-policies",
        note: "Dedicated refund policy module and app config policy field exist.",
      },
      {
        name: "Terms & Conditions",
        status: "ACTIVE",
        module: "appConfig",
        route: "/api/v1/app-config",
        note: "Managed in policy settings.",
      },
      {
        name: "Privacy Policy",
        status: "ACTIVE",
        module: "appConfig",
        route: "/api/v1/app-config",
        note: "Managed in policy settings.",
      },
    ],
  },
  {
    id: "content-management",
    title: "Content Management",
    features: [
      {
        name: "CMS Pages Management",
        status: "ACTIVE",
        module: "admin/cms",
        route: "/api/v1/admin/cms-pages",
        note: "Admin CRUD with publishing, SEO, pagination, search, and audit logging.",
      },
      {
        name: "FAQ Management",
        status: "ACTIVE",
        module: "admin/faq",
        route: "/api/v1/admin/faqs",
        note: "FAQ CRUD with category filters, ordering, publishing, and audit logging.",
      },
      {
        name: "Blog Management",
        status: "ACTIVE",
        module: "admin/blog",
        route: "/api/v1/admin/blog-posts",
        note: "Blog CRUD with slugs, publish workflow, featured posts, and SEO fields.",
      },
      {
        name: "Announcement/Notification Management",
        status: "ACTIVE",
        module: "admin/announcement",
        route: "/api/v1/admin/announcements",
        note: "Announcement CRUD for in-app, push, email, and SMS campaigns.",
      },
    ],
  },
  {
    id: "marketing-promotions",
    title: "Marketing & Promotions",
    features: [
      {
        name: "Promotional Banners",
        status: "ACTIVE",
        module: "banner",
        route: "/api/v1/banners",
        note: "Banner module supports promotional placements.",
      },
      {
        name: "Coupon Rules",
        status: "ACTIVE",
        module: "coupon",
        route: "/api/v1/coupons",
        note: "Coupon validation and rule fields exist.",
      },
      {
        name: "Flash Sales",
        status: "ACTIVE",
        module: "admin/flashSale",
        route: "/api/v1/admin/flash-sales",
        note: "Sale campaign CRUD with product assignments, countdown window, and pricing rules.",
      },
      {
        name: "Featured Products",
        status: "ACTIVE",
        module: "admin/products",
        route: "/api/v1/admin/products/:id/feature",
        note: "Dedicated feature/trending/new-arrival toggles for product merchandising.",
      },
      {
        name: "Push Notifications",
        status: "ACTIVE",
        module: "admin/announcement",
        route: "/api/v1/admin/announcements",
        note: "Announcement campaigns can target push notification audiences.",
      },
      {
        name: "Email Templates",
        status: "ACTIVE",
        module: "admin/systemConfig",
        route: "/api/v1/admin/system-config",
        note: "SMTP sender settings and write-only secrets are configurable.",
      },
    ],
  },
  {
    id: "inventory-logistics",
    title: "Inventory & Logistics",
    features: [
      {
        name: "Inventory Management",
        status: "ACTIVE",
        module: "admin/inventory",
        route: "/api/v1/admin/inventory",
        note: "Admin inventory table and stock adjustments over product variants.",
      },
      {
        name: "Stock Tracking",
        status: "ACTIVE",
        module: "admin/inventory",
        route: "/api/v1/admin/inventory",
        note: "Stock adjustments create inventory movement history.",
      },
      {
        name: "Low Stock Alerts",
        status: "ACTIVE",
        module: "admin/inventory",
        route: "/api/v1/admin/inventory?status=low-stock",
        note: "Low-stock count and filtering are available in inventory APIs and dashboard KPIs.",
      },
      {
        name: "Warehouse Management",
        status: "ACTIVE",
        module: "admin/warehouse",
        route: "/api/v1/admin/warehouses",
        note: "Dedicated warehouse CRUD with address, contact, service areas, and status.",
      },
      {
        name: "Shipping Provider Configuration",
        status: "ACTIVE",
        module: "admin/shippingProvider",
        route: "/api/v1/admin/shipping-providers",
        note: "Provider CRUD with serviceability and masked credential configuration.",
      },
    ],
  },
  {
    id: "reports-analytics",
    title: "Reports & Analytics",
    features: [
      {
        name: "Sales Reports",
        status: "ACTIVE",
        module: "admin/reports",
        route: "/api/v1/admin/reports",
        note: "Sales aggregation over orders with date filtering and export-ready rows.",
      },
      {
        name: "Order Reports",
        status: "ACTIVE",
        module: "admin/reports",
        route: "/api/v1/admin/reports",
        note: "Status and timeline summaries over admin order data.",
      },
      {
        name: "Revenue Analytics",
        status: "ACTIVE",
        module: "admin/reports",
        route: "/api/v1/admin/reports",
        note: "Revenue KPIs, daily trend, and date filters.",
      },
      {
        name: "Customer Analytics",
        status: "ACTIVE",
        module: "admin/reports",
        route: "/api/v1/admin/reports",
        note: "Customer growth and top-customer summaries.",
      },
      {
        name: "Product Performance Reports",
        status: "ACTIVE",
        module: "admin/reports",
        route: "/api/v1/admin/reports",
        note: "Product sales, quantity, and inventory performance summaries.",
      },
    ],
  },
  {
    id: "system-settings",
    title: "System Settings",
    features: [
      {
        name: "Role & Permission Management",
        status: "ACTIVE",
        module: "rbac",
        route: "/api/v1/rbac",
        note: "RBAC roles, permissions, and assignment exist.",
      },
      {
        name: "Admin User Management",
        status: "PARTIAL",
        module: "admin/user",
        route: "/api/v1/admin/people?role=ADMIN",
        note: "Admin users can be listed/invited; deeper admin profile controls can be added.",
      },
      {
        name: "Activity Logs",
        status: "ACTIVE",
        module: "admin/activityLog",
        route: "/api/v1/admin/activity-logs",
        note: "Admin activity feed records operational actions.",
      },
      {
        name: "Audit Logs",
        status: "ACTIVE",
        module: "admin/auditLog",
        route: "/api/v1/admin/audit-logs",
        note: "Sensitive admin mutations write audit log entries.",
      },
      {
        name: "API Configuration",
        status: "ACTIVE",
        module: "admin/systemConfig",
        route: "/api/v1/admin/system-config",
        note: "Secure config store with masked write-only keys and webhook secrets.",
      },
      {
        name: "Payment Gateway Settings",
        status: "ACTIVE",
        module: "admin/systemConfig",
        route: "/api/v1/admin/system-config",
        note: "Gateway provider, mode, keys, and webhook secret are configurable and masked.",
      },
      {
        name: "SMTP/Email Settings",
        status: "ACTIVE",
        module: "admin/systemConfig",
        route: "/api/v1/admin/system-config",
        note: "SMTP host, sender, username, and write-only password settings.",
      },
      {
        name: "Backup & Restore Settings",
        status: "ACTIVE",
        module: "admin/backup",
        route: "/api/v1/admin/backups",
        note: "JSON snapshot jobs with dry-run validation and explicit restore confirmation.",
      },
    ],
  },
];

export const submissionModels: Record<string, any> = {
  products: Product,
  coupons: Coupon,
  banners: Banner,
  sizeCharts: SizeChart,
  categoryRequests: SellerCategoryRequest,
};

export const listOptions = (query: any = {}) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

export const listSort = (query: any = {}, fallback = "createdAt") => ({
  [query.sortBy || fallback]: query.sortOrder === "asc" ? 1 : -1,
});

export const dateFilter = (query: any = {}) => {
  const range: any = {};
  if (query.dateFrom) range.$gte = query.dateFrom;
  if (query.dateTo) range.$lte = query.dateTo;
  return Object.keys(range).length ? { createdAt: range } : {};
};

export const dateRangeForField = (field: string, query: any = {}) => {
  const range: any = {};
  if (query.dateFrom) range.$gte = query.dateFrom;
  if (query.dateTo) range.$lte = query.dateTo;
  return Object.keys(range).length ? { [field]: range } : {};
};

export const paginatedFind = async (
  model: any,
  filter: any,
  query: any = {},
  populate?: any,
) => {
  const { page, limit, skip } = listOptions(query);
  let findQuery = model
    .find(filter)
    .sort(listSort(query))
    .skip(skip)
    .limit(limit);

  if (populate) {
    const populateItems = Array.isArray(populate) ? populate : [populate];
    for (const item of populateItems) {
      findQuery = findQuery.populate(item);
    }
  }

  const [data, total] = await Promise.all([
    findQuery.lean(),
    model.countDocuments(filter),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};

export const buildTextFilter = (query: any, fields: string[]) => {
  if (!query.search) return {};
  const regex = new RegExp(query.search, "i");
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

export const uniqueSlugFor = async (
  model: any,
  source: string,
  providedSlug?: string,
  excludeId?: string,
) => {
  const base = slugify(providedSlug || source) || `item-${Date.now()}`;
  let slug = base;
  let suffix = 1;
  const filterFor = (value: string) => ({
    slug: value,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });

  while (await model.exists(filterFor(slug))) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
};

export const asObjectId = (value: any) =>
  value instanceof Types.ObjectId ? value : new Types.ObjectId(String(value));

export const plainDoc = (doc: any) => (doc?.toObject ? doc.toObject() : doc);

export const idString = (value: any) =>
  value?._id?.toString?.() || value?.toString?.() || "";

export const deliveredSubOrderStatuses = [
  "DELIVERED",
  "DELIVERY_CONFIRMED",
  "COMPLETED",
];
export const cancelledSubOrderStatuses = [
  "CANCELLED",
  "REJECTED",
  "SELLER_REJECTED",
  "SELLER_CANCELLED",
  "CUSTOMER_CANCELLED",
  "RIDER_CANCELLED",
  "RIDER_NO_SHOW",
  "STORE_CLOSED",
  "PICKUP_FAILED",
  "DELIVERY_FAILED",
  "CUSTOMER_UNREACHABLE",
  "RETURNED",
  "REFUNDED",
];

export const payoutSummaryFromRows = (rows: any[] = []) =>
  rows.reduce(
    (summary, payout) => {
      const amount = Number(payout.amount || 0);
      if (payout.status === "PAID") {
        summary.paidAmount += amount;
        summary.paidCount += 1;
      }
      if (reservedPayoutStatuses.includes(payout.status)) {
        summary.pendingAmount += amount;
        summary.pendingCount += 1;
      }
      if (payout.status === "FAILED") {
        summary.failedCount += 1;
      }
      return summary;
    },
    {
      paidAmount: 0,
      pendingAmount: 0,
      paidCount: 0,
      pendingCount: 0,
      failedCount: 0,
    },
  );

export const transactionDate = (transaction: any) =>
  new Date(
    transaction.createdAt ||
      transaction.creditedAt ||
      transaction.depositedAt ||
      0,
  ).getTime();

export const serializePayoutTransaction = (payout: any) => ({
  _id: idString(payout._id),
  type: "PAYOUT",
  label: payout.status === "PAID" ? "Payout paid" : "Payout request",
  amount: Number(payout.amount || 0),
  status: payout.status,
  method: payout.method,
  referenceId: payout.referenceId,
  note: payout.note,
  createdAt: payout.createdAt,
});

export const platformGrossExpression = () => ({
  $cond: [
    { $gt: [{ $ifNull: ["$appGrossRevenue", 0] }, 0] },
    "$appGrossRevenue",
    {
      $add: [
        { $ifNull: ["$platformCommissionTotal", 0] },
        { $ifNull: ["$shippingFee", 0] },
        { $ifNull: ["$dynamicDeliverySurcharge", 0] },
      ],
    },
  ],
});

export const platformNetExpression = () => ({
  $cond: [
    { $gt: [{ $ifNull: ["$appNetAfterRiderEstimate", 0] }, 0] },
    "$appNetAfterRiderEstimate",
    {
      $subtract: [
        platformGrossExpression(),
        { $ifNull: ["$riderPayoutEstimateTotal", 0] },
      ],
    },
  ],
});

export const usernameFrom = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "") || `user_${Date.now()}`;

export const uniqueUsername = async (source: string, excludeId?: string) => {
  const base = usernameFrom(source);
  let username = base;
  let suffix = 1;
  const filterFor = (value: string) => ({
    username: value,
    ...(excludeId ? { _id: { $ne: asObjectId(excludeId) } } : {}),
  });

  while (await User.exists(filterFor(username))) {
    suffix += 1;
    username = `${base}_${suffix}`;
  }

  return username;
};

export const assertEmailAvailable = async (
  email: string,
  excludeId?: string,
) => {
  const existing = await User.findOne({
    email: email.toLowerCase(),
    ...(excludeId ? { _id: { $ne: asObjectId(excludeId) } } : {}),
  })
    .select("_id")
    .lean();
  if (existing)
    throw new ApiError(409, "Email is already used by another user");
};

export const cleanPolicyRefs = (refs: any = {}) => {
  const next: Record<string, Types.ObjectId> = {};
  ["returnPolicy", "refundPolicy", "shippingPolicy", "termsPolicy"].forEach(
    (key) => {
      if (refs?.[key]) next[key] = asObjectId(refs[key]);
    },
  );
  return next;
};

export const mask = (value: any) => (value ? "********" : value);

export const isMasked = (value: unknown) =>
  typeof value === "string" && /^(\*{4,}|masked)$/i.test(value.trim());

export const mergeWriteOnlySecrets = (
  incoming: any = {},
  existing: any = {},
) => {
  const next = { ...incoming };

  if ("secretKey" in next && (!next.secretKey || isMasked(next.secretKey)))
    next.secretKey = existing.secretKey;
  if (
    "webhookSecret" in next &&
    (!next.webhookSecret || isMasked(next.webhookSecret))
  )
    next.webhookSecret = existing.webhookSecret;
  if ("password" in next && (!next.password || isMasked(next.password)))
    next.password = existing.password;

  if (Array.isArray(next.keys)) {
    const existingKeys = Array.isArray(existing.keys) ? existing.keys : [];
    next.keys = next.keys.map((item: any, index: number) => ({
      ...item,
      key:
        item.key && !isMasked(item.key) ? item.key : existingKeys[index]?.key,
      secret:
        item.secret && !isMasked(item.secret)
          ? item.secret
          : existingKeys[index]?.secret,
    }));
  }

  if (Array.isArray(next.webhooks)) {
    const existingWebhooks = Array.isArray(existing.webhooks)
      ? existing.webhooks
      : [];
    next.webhooks = next.webhooks.map((item: any, index: number) => ({
      ...item,
      secret:
        item.secret && !isMasked(item.secret)
          ? item.secret
          : existingWebhooks[index]?.secret,
    }));
  }

  return next;
};

export const maskSystemConfig = (config: any = {}) => ({
  ...config,
  api: {
    ...(config.api || {}),
    keys: (config.api?.keys || []).map((item: any) => ({
      ...item,
      key: mask(item.key),
      secret: mask(item.secret),
    })),
    webhooks: (config.api?.webhooks || []).map((item: any) => ({
      ...item,
      secret: mask(item.secret),
    })),
  },
  payment: {
    ...(config.payment || {}),
    secretKey: mask(config.payment?.secretKey),
    webhookSecret: mask(config.payment?.webhookSecret),
  },
  smtp: {
    ...(config.smtp || {}),
    password: mask(config.smtp?.password),
  },
});

export const allowedBackupCollections: Record<string, any> = {
  cmsPages: CMSPage,
  faqs: FAQ,
  blogPosts: BlogPost,
  announcements: Announcement,
  flashSales: FlashSale,
  warehouses: Warehouse,
  shippingProviders: ShippingProvider,
  systemConfigs: AdminSystemConfig,
};

export const defaultBackupCollections = Object.keys(allowedBackupCollections);

export const notificationForSubmission = async (
  sellerId: any,
  type: string,
  status: string,
  itemId: string,
  reason?: string,
) => {
  if (!sellerId) return;
  await SellerNotification.create({
    sellerId,
    type: "APPROVAL",
    title: `${type} ${status.toLowerCase()}`,
    message:
      status === "APPROVED"
        ? `Your ${type} submission has been approved.`
        : `Your ${type} submission was rejected.${reason ? ` Reason: ${reason}` : ""}`,
    severity: status === "APPROVED" ? "SUCCESS" : "ERROR",
    resourceType: type,
    resourceId: itemId,
  });
};

export const serializeSellerStore = (store?: any) =>
  store
    ? {
        _id: store._id?.toString(),
        name: store.name,
        isActive: !!store.isActive,
        isSetupComplete: !!store.isSetupComplete,
        setupMissingFields: store.setupMissingFields || [],
        address: store.address,
        contact: store.contact || {},
        deliveryConfig: store.deliveryConfig || {},
        policies: undefined,
        policyRefs: store.policyRefs || {},
        categoryConfig: {
          primaryCategory: store.categoryConfig?.primaryCategory,
          subcategories: store.categoryConfig?.subcategories || [],
          assignedByAdmin: !!store.categoryConfig?.assignedByAdmin,
        },
      }
    : null;

export const serializeUser = (
  user: any,
  sellerProfile?: any,
  deliveryProfile?: any,
  sellerStore?: any,
) => ({
  _id: user._id?.toString(),
  username: user.username,
  email: user.email,
  fullName: user.fullName,
  phone: user.phone,
  role: roleNameOf(user.roleId),
  isVerified: !!user.isVerified,
  isBlocked: !!user.isBlocked,
  deletedAt: user.deletedAt,
  deletedBy: user.deletedBy?._id?.toString?.() || user.deletedBy?.toString?.(),
  deletionReason: user.deletionReason,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  sellerProfile: sellerProfile
    ? {
        status: sellerProfile.status,
        isVerified: !!sellerProfile.isVerified,
        businessName: sellerProfile.businessName,
        sellerType: sellerProfile.sellerType,
        gstNumber: sellerProfile.gstNumber,
        mallId:
          sellerProfile.mallId?._id?.toString() ||
          sellerProfile.mallId?.toString(),
        mallName: sellerProfile.mallId?.name,
        mallUnit: sellerProfile.mallUnit,
        mallFloor: sellerProfile.mallFloor,
        mallRequest: sellerProfile.mallRequest
          ? {
              mallId:
                sellerProfile.mallRequest.mallId?._id?.toString() ||
                sellerProfile.mallRequest.mallId?.toString(),
              mallName: sellerProfile.mallRequest.mallId?.name,
              mallUnit: sellerProfile.mallRequest.mallUnit,
              mallFloor: sellerProfile.mallRequest.mallFloor,
              message: sellerProfile.mallRequest.message,
              status: sellerProfile.mallRequest.status,
              requestedAt: sellerProfile.mallRequest.requestedAt,
              reviewedAt: sellerProfile.mallRequest.reviewedAt,
              rejectionReason: sellerProfile.mallRequest.rejectionReason,
            }
          : null,
        payoutMethodsSummary: {
          total: sellerProfile.payoutMethods?.length || 0,
          verified:
            sellerProfile.payoutMethods?.filter(
              (method: any) => method.status === "VERIFIED",
            ).length || 0,
          pending:
            sellerProfile.payoutMethods?.filter(
              (method: any) => method.status === "PENDING_VERIFICATION",
            ).length || 0,
          rejected:
            sellerProfile.payoutMethods?.filter(
              (method: any) => method.status === "REJECTED",
            ).length || 0,
        },
        wallet: sellerProfile.wallet || {
          availableBalance: 0,
          pendingPayoutBalance: 0,
          lifetimeEarnings: 0,
        },
        store: serializeSellerStore(sellerStore),
      }
    : null,
  deliveryProfile: deliveryProfile
    ? {
        status: deliveryProfile.status,
        isVerified: !!deliveryProfile.isVerified,
        isOnline: !!deliveryProfile.isOnline,
        vehicleType: deliveryProfile.vehicleType,
        vehicleNumber: deliveryProfile.vehicleNumber,
        licenseNumber: deliveryProfile.licenseNumber,
        address: deliveryProfile.address,
        payoutMethodsSummary: {
          total: deliveryProfile.payoutMethods?.length || 0,
          verified:
            deliveryProfile.payoutMethods?.filter(
              (method: any) => method.status === "VERIFIED",
            ).length || 0,
          pending:
            deliveryProfile.payoutMethods?.filter(
              (method: any) => method.status === "PENDING_VERIFICATION",
            ).length || 0,
          rejected:
            deliveryProfile.payoutMethods?.filter(
              (method: any) => method.status === "REJECTED",
            ).length || 0,
        },
        wallet: deliveryProfile.wallet || {
          availableBalance: 0,
          pendingPayoutBalance: 0,
          lifetimeEarnings: 0,
          collectedCodLiability: 0,
        },
        currentLocation: deliveryProfile.currentLocation
          ? {
              longitude: deliveryProfile.currentLocation.coordinates?.[0],
              latitude: deliveryProfile.currentLocation.coordinates?.[1],
            }
          : null,
      }
    : null,
});
