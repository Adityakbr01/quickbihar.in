import axiosInstance from "@/lib/axios";

export type AdminRole = "USER" | "SELLER" | "DELIVERY" | "ADMIN" | "SUPER_ADMIN";
export type PartnerType = "SELLER" | "DELIVERY";
export type PartnerStatus = "PENDING" | "APPROVED" | "REJECTED";
export type PayoutStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED";
export type ManagementStatus = "ACTIVE" | "PARTIAL" | "PLANNED";
export type SellerSubmissionType = "products" | "coupons" | "banners" | "sizeCharts" | "categoryRequests";
export type SellerSubmissionStatus = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "PENDING" | "ALL";

export interface PartnerProfile {
  status: PartnerStatus;
  isVerified: boolean;
  businessName?: string;
  sellerType?: string;
  gstNumber?: string;
  address?: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  mallId?: string;
  mallName?: string;
  mallUnit?: string;
  mallFloor?: string;
  mallRequest?: SellerMallRequest["request"] | null;
  payoutMethodsSummary?: {
    total: number;
    verified: number;
    pending: number;
    rejected: number;
  };
  wallet?: {
    availableBalance: number;
    pendingPayoutBalance: number;
    lifetimeEarnings: number;
    collectedCodLiability?: number;
  };
  store?: {
    _id: string;
    name?: string;
    isActive?: boolean;
    isSetupComplete?: boolean;
    setupMissingFields?: string[];
    address?: {
      line1?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
    };
    deliveryConfig?: {
      deliveryAreas?: string[];
      shippingFee?: number;
      freeShippingThreshold?: number;
    };
    policies?: {
      returnPolicy?: string;
      refundPolicy?: string;
      shippingPolicy?: string;
      termsAndConditions?: string;
    };
    categoryConfig?: {
      primaryCategory?: string;
      subcategories?: string[];
      assignedByAdmin?: boolean;
    };
  } | null;
  isOnline?: boolean;
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
}

export interface ManagedPerson {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: AdminRole;
  isVerified: boolean;
  isBlocked: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;
  createdAt?: string;
  sellerProfile?: PartnerProfile | null;
  deliveryProfile?: PartnerProfile | null;
}

export interface DashboardStats {
  totalUsers: number;
  blockedUsers: number;
  verifiedUsers: number;
  sellers: number;
  deliveryBoys: number;
  pendingPartners: number;
  pendingPayouts: number;
  totalPaid: number;
  malls: number;
  activeMalls: number;
  mallLinkedSellers: number;
  pendingMallRequests: number;
  pendingMallCreations?: number;
  pendingPayoutMethods?: number;
  totalOrders?: number;
  pendingOrders?: number;
  deliveredOrders?: number;
  revenue?: number;
  totalSales?: number;
  platformEarnings?: number;
  platformNetEarnings?: number;
  platformCommission?: number;
  deliveryRevenue?: number;
  riderPayoutEstimate?: number;
  totalProducts?: number;
  lowStockProducts?: number;
  pendingReviews?: number;
  activeFlashSales?: number;
  sentAnnouncements?: number;
}

export interface Payout {
  _id: string;
  partnerId: ManagedPerson | { fullName: string; email: string; _id: string };
  partnerType: PartnerType;
  amount: number;
  status: PayoutStatus;
  method?: string;
  payoutMethodId?: string;
  referenceId?: string;
  note?: string;
  createdAt?: string;
}

export interface DashboardResponse {
  stats: DashboardStats;
  dailyRevenue?: Array<{
    _id: string;
    orders: number;
    revenue: number;
    platformEarnings: number;
    platformNetEarnings: number;
  }>;
  ordersByStatus?: Array<{
    _id: string;
    count: number;
    revenue: number;
    platformEarnings: number;
  }>;
  recentPayouts: Payout[];
  topMalls: Mall[];
}

export interface Mall {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  contact?: {
    managerName?: string;
    phone?: string;
    email?: string;
  };
  logoUrl?: string;
  coverImageUrl?: string;
  totalStores?: number;
  sellerCount?: number;
  rating?: number;
  isFeatured?: boolean;
  featuredRank?: number;
  isActive: boolean;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  requestedBy?: {
    _id: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
  request?: {
    mallUnit?: string;
    mallFloor?: string;
    message?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface MallPayload {
  name: string;
  description?: string;
  address?: Mall["address"];
  contact?: Mall["contact"];
  logoUrl?: string;
  coverImageUrl?: string;
  totalStores?: number;
  rating?: number;
  isFeatured?: boolean;
  featuredRank?: number;
  isActive?: boolean;
  status?: "PENDING" | "APPROVED" | "REJECTED";
}

export interface SellerMallRequest {
  _id: string;
  sellerId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  status?: PartnerStatus;
  currentMallId?: string;
  request: {
    mallId: string;
    mallName?: string;
    mallUnit?: string;
    mallFloor?: string;
    message?: string;
    status: PartnerStatus;
    requestedAt?: string;
  };
}

export interface ManagementFeature {
  name: string;
  status: ManagementStatus;
  module: string;
  route?: string | null;
  note: string;
}

export interface ManagementGroup {
  id: string;
  title: string;
  features: ManagementFeature[];
  summary: {
    total: number;
    active: number;
    partial: number;
    planned: number;
  };
}

export interface PayoutMethod {
  _id: string;
  partnerType?: PartnerType;
  partnerId?: string;
  sellerId?: string;
  sellerProfileId?: string;
  sellerName?: string;
  sellerEmail?: string;
  businessName?: string;
  deliveryId?: string;
  deliveryProfileId?: string;
  riderName?: string;
  riderEmail?: string;
  vehicleNumber?: string;
  type: "BANK" | "UPI" | "PAYPAL" | "STRIPE_CONNECT";
  label?: string;
  status: "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED";
  isDefault: boolean;
  bank?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifsc?: string;
    bankName?: string;
  };
  upi?: {
    upiId?: string;
  };
  paypal?: {
    email?: string;
  };
  stripeConnect?: {
    accountId?: string;
  };
  rejectionReason?: string;
  createdAt?: string;
  verifiedAt?: string;
}

export interface AppConfig {
  store?: {
    storeName?: string;
    appTitle?: string;
  };
  policies?: {
    privacyPolicy?: string;
    termsAndConditions?: string;
    returnPolicy?: string;
    shippingPolicy?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  shipping?: {
    freeShippingThreshold?: number;
    shippingFee?: number;
  };
  tax?: {
    enabled?: boolean;
    rate?: number;
    inclusive?: boolean;
  };
  currency?: {
    code?: string;
    symbol?: string;
  };
  marketplace?: {
    commissionPercent?: number;
  };
  delivery?: {
    defaultRadiusKm?: number;
    minOrderAmount?: number;
    estimatedMinutes?: number;
    riderPayoutAmount?: number;
    riderPayoutRules?: {
      upto3Km?: number;
      upto5Km?: number;
      upto8Km?: number;
      extraPerKmAfter8?: number;
      rainBonus?: number;
      peakBonus?: number;
      festivalBonus?: number;
      nightBonus?: number;
    };
    bonusRules?: {
      rainBonus?: number;
      peakBonus?: number;
      festivalBonus?: number;
      nightBonus?: number;
      rainMode?: "AUTO" | "FORCE_ON" | "FORCE_OFF";
      peakMode?: "AUTO" | "FORCE_ON" | "FORCE_OFF";
      festivalMode?: "AUTO" | "FORCE_ON" | "FORCE_OFF";
      nightMode?: "AUTO" | "FORCE_ON" | "FORCE_OFF";
      peakWindows?: Array<{ start: string; end: string }>;
      festivalWindows?: Array<{ name?: string; startDate: string; endDate: string }>;
      nightStart?: string;
      nightEnd?: string;
    };
  };
}

export interface Policy {
  _id: string;
  name: string;
  policyType: "RETURN" | "REFUND" | "SHIPPING" | "TERMS" | "GENERAL";
  category?: string;
  description?: string;
  returnWindowDays?: number;
  refundProcessingDays?: number;
  conditions?: string[];
  refundType?: string;
  returnShipping?: string;
  isReturnable?: boolean;
  isExchangeAvailable?: boolean;
  isDefault?: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type PolicyPayload = Partial<Omit<Policy, "_id" | "createdAt" | "updatedAt">>;

export interface SellerPayload {
  fullName: string;
  email: string;
  username?: string;
  phone?: string;
  password?: string;
  isVerified?: boolean;
  isBlocked?: boolean;
  seller?: {
    businessName?: string;
    sellerType?: string;
    gstNumber?: string;
    status?: PartnerStatus;
    isVerified?: boolean;
    mallId?: string;
    mallUnit?: string;
    mallFloor?: string;
    address?: {
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
  };
  store?: {
    name?: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    isActive?: boolean;
    isVerified?: boolean;
    address?: {
      line1?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
      postalCode?: string;
    };
    contact?: {
      email?: string;
      phone?: string;
    };
    categoryConfig?: {
      primaryCategory?: string;
      subcategories?: string[];
    };
    policyRefs?: {
      returnPolicy?: string;
      refundPolicy?: string;
      shippingPolicy?: string;
      termsPolicy?: string;
    };
  };
}

export interface AdminUserPayload {
  fullName?: string;
  email?: string;
  username?: string;
  phone?: string;
  password?: string;
  role?: AdminRole;
  isVerified?: boolean;
  isBlocked?: boolean;
  deletionReason?: string;
}

export interface SellerSubmission {
  _id: string;
  sellerId?: {
    _id: string;
    fullName?: string;
    email?: string;
    phone?: string;
  } | string;
  storeId?: {
    _id: string;
    name?: string;
  } | string;
  title?: string;
  name?: string;
  code?: string;
  requestedPrimaryCategory?: string;
  requestedSubcategories?: string[];
  category?: string;
  approvalStatus?: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  status?: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  createdAt?: string;
}

export interface SellerSubmissionResponse {
  data: SellerSubmission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedAdminResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type PublishStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface SeoFields {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface CMSPage {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: PublishStatus;
  isActive: boolean;
  sortOrder?: number;
  seo?: SeoFields;
  createdAt?: string;
}

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  sortOrder?: number;
  status: PublishStatus;
  isActive: boolean;
  createdAt?: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  tags?: string[];
  status: PublishStatus;
  isActive: boolean;
  isFeatured?: boolean;
  seo?: SeoFields;
  createdAt?: string;
}

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  channel: "IN_APP" | "PUSH" | "EMAIL" | "SMS";
  audience: "ALL" | "USERS" | "SELLERS" | "DELIVERY";
  status: "DRAFT" | "SCHEDULED" | "SENT" | "ARCHIVED";
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface FlashSale {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  productIds?: Array<string | { _id: string; title?: string; price?: number }>;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  startsAt: string;
  endsAt: string;
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "ENDED" | "ARCHIVED";
  isActive: boolean;
  createdAt?: string;
}

export interface Warehouse {
  _id: string;
  name: string;
  code: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  serviceAreas?: string[];
  capacity?: number;
  isActive: boolean;
}

export interface ShippingProvider {
  _id: string;
  name: string;
  code: string;
  type: "MANUAL" | "COURIER" | "HYPERLOCAL" | "AGGREGATOR";
  serviceAreas?: string[];
  config?: Record<string, unknown>;
  isActive: boolean;
}

export interface InventoryMovement {
  _id: string;
  sku: string;
  variantLabel?: string;
  movementType: "IN" | "OUT" | "ADJUSTMENT" | "ORDER" | "RETURN";
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  createdAt?: string;
}

export interface AdminInventoryProduct {
  _id: string;
  title: string;
  brand?: string;
  category?: string;
  totalStock?: number;
  isActive?: boolean;
  sellerId?: { _id: string; fullName?: string; email?: string } | string;
  storeId?: { _id: string; name?: string } | string;
  variants?: Array<{ size: string; color: string; sku?: string; stock: number; price?: number }>;
  createdAt?: string;
}

export interface InventoryResponse extends PaginatedAdminResult<AdminInventoryProduct> {
  lowStockCount: number;
  outOfStockCount: number;
  movements: InventoryMovement[];
}

export interface AdminReports {
  summary: {
    revenue: number;
    sales: number;
    orderCount: number;
    tax: number;
    shipping: number;
    discounts: number;
    totalCustomers: number;
    newCustomers: number;
    totalProducts: number;
    activeProducts: number;
    totalStock: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  };
  ordersByStatus: Array<{ _id: string; count: number; revenue: number }>;
  dailyRevenue: Array<{ _id: string; revenue: number; orders: number }>;
  productPerformance: Array<{ _id: string; title: string; sku: string; quantity: number; revenue: number }>;
  customerSummary: Array<{ _id: string; fullName?: string; email?: string; orders: number; revenue: number; lastOrderAt?: string }>;
}

export interface PartnerSummary {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  grossAmount: number;
  partnerEarnings: number;
  riderPayoutAmount?: number;
  distanceKm?: number;
  availableBalance: number;
  pendingPayoutBalance: number;
  lifetimeEarnings: number;
  collectedCodLiability?: number;
  paidPayoutAmount: number;
  pendingPayoutAmount: number;
  paidPayoutCount: number;
  pendingPayoutCount: number;
  failedPayoutCount: number;
  transactionCount: number;
}

export interface PartnerStatusBreakdownRow {
  _id: string;
  count: number;
  grossAmount: number;
  partnerEarnings: number;
}

export interface PartnerDailyReportRow {
  _id: string;
  orders: number;
  deliveredOrders: number;
  grossAmount: number;
  partnerEarnings: number;
}

export interface PartnerTransaction {
  _id: string;
  type: "EARNING" | "PAYOUT" | "COD_SETTLEMENT";
  label: string;
  amount: number;
  grossAmount?: number;
  commissionAmount?: number;
  status?: string;
  method?: string;
  referenceId?: string;
  note?: string;
  createdAt?: string;
}

export interface PartnerInsight {
  partner: ManagedPerson;
  summary: PartnerSummary;
  statusBreakdown: PartnerStatusBreakdownRow[];
  daily: PartnerDailyReportRow[];
  transactions: PartnerTransaction[];
  productPerformance?: Array<{ _id: string; title?: string; sku?: string; quantity: number; revenue: number }>;
  inventory?: {
    totalProducts: number;
    activeProducts: number;
    totalStock: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  };
  riderPerformance?: {
    totalPayout: number;
    totalDistanceKm: number;
    rainBonus: number;
    peakBonus: number;
    festivalBonus: number;
    nightBonus: number;
    codCollected: number;
  };
  codSettlements?: Array<{
    _id: string;
    amount: number;
    previousLiability?: number;
    newLiability?: number;
    status: "PENDING" | "VERIFIED" | "REJECTED";
    referenceId?: string;
    note?: string;
    depositedAt?: string;
    createdAt?: string;
  }>;
}

export interface AdminSubOrder {
  _id: string;
  subOrderId: string;
  parentOrderId?: {
    _id?: string;
    orderId?: string;
    shippingAddress?: {
      fullName?: string;
      phone?: string;
      street?: string;
      city?: string;
      pincode?: string;
    };
  };
  sellerId?: { _id?: string; fullName?: string; email?: string } | string;
  storeId?: {
    _id?: string;
    name?: string;
    contact?: { phone?: string };
    address?: { line1?: string; city?: string };
  };
  items?: Array<{
    title?: string;
    sku?: string;
    size?: string;
    color?: string;
    quantity: number;
    price: number;
  }>;
  payableAmount?: number;
  status: string;
  packageDetails?: {
    isCod?: boolean;
    weight?: number;
    packageCount?: number;
    isFragile?: boolean;
  };
  delivery?: {
    status?: string;
    riderId?: { _id?: string; fullName?: string; phone?: string } | string;
    payoutAmount?: number;
  };
  timeline?: Array<{ status?: string; timestamp?: string }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminLog {
  _id: string;
  actorId?: { fullName?: string; email?: string } | string;
  action: string;
  resourceType: string;
  resourceId?: string;
  message?: string;
  severity?: "INFO" | "WARNING" | "ERROR";
  createdAt?: string;
}

export interface AdminSystemConfig {
  api?: {
    enabled?: boolean;
    baseUrl?: string;
    keys?: Array<{ label: string; key?: string; secret?: string; enabled?: boolean }>;
    webhooks?: Array<{ label: string; url: string; secret?: string; enabled?: boolean }>;
  };
  payment?: {
    provider?: string;
    mode?: "TEST" | "LIVE";
    enabled?: boolean;
    publicKey?: string;
    secretKey?: string;
    webhookSecret?: string;
  };
  smtp?: {
    host?: string;
    port?: number;
    secure?: boolean;
    username?: string;
    password?: string;
    fromEmail?: string;
    fromName?: string;
  };
  backup?: {
    autoBackupEnabled?: boolean;
    frequency?: "DAILY" | "WEEKLY" | "MONTHLY";
    retentionDays?: number;
  };
}

export interface BackupJob {
  _id: string;
  name: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "RESTORED";
  collections: string[];
  dryRunResult?: Record<string, unknown>;
  error?: string;
  createdAt?: string;
  restoredAt?: string;
}

export const adminManagementApi = {
  getManagementCatalog: async (): Promise<ManagementGroup[]> => {
    const response = await axiosInstance.get("/admin/management-catalog");
    return response.data.data;
  },

  getDashboard: async (): Promise<DashboardResponse> => {
    const response = await axiosInstance.get("/admin/dashboard");
    return response.data.data;
  },

  getAppConfig: async (): Promise<AppConfig> => {
    const response = await axiosInstance.get("/app-config");
    return response.data.data;
  },

  updateAppConfig: async (payload: AppConfig): Promise<AppConfig> => {
    const response = await axiosInstance.patch("/app-config", payload);
    return response.data.data;
  },

  getPeople: async (params: { role?: string; status?: string; search?: string }): Promise<ManagedPerson[]> => {
    const response = await axiosInstance.get("/admin/people", { params });
    return response.data.data;
  },

  getUser: async (id: string): Promise<ManagedPerson> => {
    const response = await axiosInstance.get(`/admin/users/${id}`);
    return response.data.data;
  },

  createUser: async (payload: AdminUserPayload): Promise<ManagedPerson> => {
    const response = await axiosInstance.post("/admin/users", payload);
    return response.data.data;
  },

  updateUser: async ({ id, payload }: { id: string; payload: AdminUserPayload }): Promise<ManagedPerson> => {
    const response = await axiosInstance.patch(`/admin/users/${id}`, payload);
    return response.data.data;
  },

  deleteUser: async ({ id, deletionReason }: { id: string; deletionReason?: string }): Promise<ManagedPerson> => {
    const response = await axiosInstance.delete(`/admin/users/${id}`, { data: { deletionReason } });
    return response.data.data;
  },

  setBlocked: async ({ userId, isBlocked }: { userId: string; isBlocked: boolean }): Promise<ManagedPerson> => {
    const response = await axiosInstance.patch(`/admin/users/${userId}/block`, { isBlocked });
    return response.data.data;
  },

  updatePartnerStatus: async ({
    userId,
    type,
    status,
  }: {
    userId: string;
    type: PartnerType;
    status: PartnerStatus;
  }) => {
    const response = await axiosInstance.patch(`/admin/partners/${userId}/status`, { type, status });
    return response.data.data;
  },

  sendInvite: async (payload: { email: string; role: AdminRole; fullName?: string; message?: string }) => {
    const response = await axiosInstance.post("/admin/invites", payload);
    return response.data.data;
  },

  getPayouts: async (): Promise<Payout[]> => {
    const response = await axiosInstance.get("/admin/payouts");
    return response.data.data;
  },

  createPayout: async (payload: {
    partnerId: string;
    partnerType: PartnerType;
    amount: number;
    method?: string;
    referenceId?: string;
    note?: string;
    status?: PayoutStatus;
  }): Promise<Payout> => {
    const response = await axiosInstance.post("/admin/payouts", payload);
    return response.data.data;
  },

  updatePayoutStatus: async ({
    payoutId,
    status,
    referenceId,
    note,
  }: {
    payoutId: string;
    status: PayoutStatus;
    referenceId?: string;
    note?: string;
  }): Promise<Payout> => {
    const response = await axiosInstance.patch(`/admin/payouts/${payoutId}/status`, { status, referenceId, note });
    return response.data.data;
  },

  getPayoutMethods: async (params: { status?: PayoutMethod["status"] } = {}): Promise<PayoutMethod[]> => {
    const response = await axiosInstance.get("/admin/payout-methods", { params });
    return response.data.data;
  },

  reviewPayoutMethod: async ({
    sellerId,
    deliveryId,
    methodId,
    status,
    reason,
  }: {
    sellerId?: string;
    deliveryId?: string;
    methodId: string;
    status: "VERIFIED" | "REJECTED";
    reason?: string;
  }): Promise<PayoutMethod> => {
    const path = deliveryId
      ? `/admin/delivery/${deliveryId}/payout-methods/${methodId}/status`
      : `/admin/sellers/${sellerId}/payout-methods/${methodId}/status`;
    const response = await axiosInstance.patch(path, { status, reason });
    return response.data.data;
  },

  getMalls: async (): Promise<Mall[]> => {
    const response = await axiosInstance.get("/admin/malls");
    return response.data.data;
  },

  getMallRequests: async (): Promise<SellerMallRequest[]> => {
    const response = await axiosInstance.get("/admin/mall-requests");
    return response.data.data;
  },

  getMallCreationRequests: async (): Promise<Mall[]> => {
    const response = await axiosInstance.get("/admin/mall-creation-requests");
    return response.data.data;
  },

  createMall: async (payload: MallPayload): Promise<Mall> => {
    const response = await axiosInstance.post("/admin/malls", payload);
    return response.data.data;
  },

  updateMall: async ({ mallId, updates }: { mallId: string; updates: Partial<MallPayload> }): Promise<Mall> => {
    const response = await axiosInstance.patch(`/admin/malls/${mallId}`, updates);
    return response.data.data;
  },

  reviewMallCreation: async ({
    mallId,
    status,
    reason,
  }: {
    mallId: string;
    status: "APPROVED" | "REJECTED";
    reason?: string;
  }): Promise<Mall> => {
    const response = await axiosInstance.patch(`/admin/malls/${mallId}/review`, { status, reason });
    return response.data.data;
  },

  deactivateMall: async (mallId: string): Promise<Mall> => {
    const response = await axiosInstance.delete(`/admin/malls/${mallId}`);
    return response.data.data;
  },

  assignSellerMall: async (payload: {
    sellerId: string;
    mallId?: string | null;
    mallUnit?: string;
    mallFloor?: string;
  }) => {
    const { sellerId, ...body } = payload;
    const response = await axiosInstance.patch(`/admin/sellers/${sellerId}/mall`, body);
    return response.data.data;
  },

  reviewMallRequest: async ({
    sellerId,
    status,
    reason,
  }: {
    sellerId: string;
    status: "APPROVED" | "REJECTED";
    reason?: string;
  }) => {
    const response = await axiosInstance.patch(`/admin/sellers/${sellerId}/mall-request`, { status, reason });
    return response.data.data;
  },

  getSellerSubmissions: async (params: {
    type?: SellerSubmissionType;
    status?: SellerSubmissionStatus;
    page?: number;
    limit?: number;
  }): Promise<SellerSubmissionResponse> => {
    const response = await axiosInstance.get("/admin/seller-submissions", { params });
    return response.data.data;
  },

  reviewSellerSubmission: async ({
    type,
    id,
    status,
    reason,
    placement,
    priority,
    startDate,
    endDate,
  }: {
    type: SellerSubmissionType;
    id: string;
    status: "APPROVED" | "REJECTED";
    reason?: string;
    placement?: "home_top" | "home_middle" | "category";
    priority?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await axiosInstance.patch(`/admin/seller-submissions/${type}/${id}/review`, {
      status,
      reason,
      placement,
      priority,
      startDate,
      endDate,
    });
    return response.data.data;
  },

  getCMSPages: async (params: AdminListParams): Promise<PaginatedAdminResult<CMSPage>> => {
    const response = await axiosInstance.get("/admin/cms-pages", { params });
    return response.data.data;
  },

  createCMSPage: async (payload: Partial<CMSPage>): Promise<CMSPage> => {
    const response = await axiosInstance.post("/admin/cms-pages", payload);
    return response.data.data;
  },

  updateCMSPage: async ({ id, payload }: { id: string; payload: Partial<CMSPage> }): Promise<CMSPage> => {
    const response = await axiosInstance.patch(`/admin/cms-pages/${id}`, payload);
    return response.data.data;
  },

  deleteCMSPage: async (id: string): Promise<CMSPage> => {
    const response = await axiosInstance.delete(`/admin/cms-pages/${id}`);
    return response.data.data;
  },

  getFAQs: async (params: AdminListParams): Promise<PaginatedAdminResult<FAQ>> => {
    const response = await axiosInstance.get("/admin/faqs", { params });
    return response.data.data;
  },

  createFAQ: async (payload: Partial<FAQ>): Promise<FAQ> => {
    const response = await axiosInstance.post("/admin/faqs", payload);
    return response.data.data;
  },

  updateFAQ: async ({ id, payload }: { id: string; payload: Partial<FAQ> }): Promise<FAQ> => {
    const response = await axiosInstance.patch(`/admin/faqs/${id}`, payload);
    return response.data.data;
  },

  deleteFAQ: async (id: string): Promise<FAQ> => {
    const response = await axiosInstance.delete(`/admin/faqs/${id}`);
    return response.data.data;
  },

  getBlogPosts: async (params: AdminListParams): Promise<PaginatedAdminResult<BlogPost>> => {
    const response = await axiosInstance.get("/admin/blog-posts", { params });
    return response.data.data;
  },

  createBlogPost: async (payload: Partial<BlogPost>): Promise<BlogPost> => {
    const response = await axiosInstance.post("/admin/blog-posts", payload);
    return response.data.data;
  },

  updateBlogPost: async ({ id, payload }: { id: string; payload: Partial<BlogPost> }): Promise<BlogPost> => {
    const response = await axiosInstance.patch(`/admin/blog-posts/${id}`, payload);
    return response.data.data;
  },

  deleteBlogPost: async (id: string): Promise<BlogPost> => {
    const response = await axiosInstance.delete(`/admin/blog-posts/${id}`);
    return response.data.data;
  },

  getAnnouncements: async (params: AdminListParams): Promise<PaginatedAdminResult<Announcement>> => {
    const response = await axiosInstance.get("/admin/announcements", { params });
    return response.data.data;
  },

  createAnnouncement: async (payload: Partial<Announcement>): Promise<Announcement> => {
    const response = await axiosInstance.post("/admin/announcements", payload);
    return response.data.data;
  },

  updateAnnouncement: async ({ id, payload }: { id: string; payload: Partial<Announcement> }): Promise<Announcement> => {
    const response = await axiosInstance.patch(`/admin/announcements/${id}`, payload);
    return response.data.data;
  },

  deleteAnnouncement: async (id: string): Promise<Announcement> => {
    const response = await axiosInstance.delete(`/admin/announcements/${id}`);
    return response.data.data;
  },

  getFlashSales: async (params: AdminListParams): Promise<PaginatedAdminResult<FlashSale>> => {
    const response = await axiosInstance.get("/admin/flash-sales", { params });
    return response.data.data;
  },

  createFlashSale: async (payload: Partial<FlashSale>): Promise<FlashSale> => {
    const response = await axiosInstance.post("/admin/flash-sales", payload);
    return response.data.data;
  },

  updateFlashSale: async ({ id, payload }: { id: string; payload: Partial<FlashSale> }): Promise<FlashSale> => {
    const response = await axiosInstance.patch(`/admin/flash-sales/${id}`, payload);
    return response.data.data;
  },

  deleteFlashSale: async (id: string): Promise<FlashSale> => {
    const response = await axiosInstance.delete(`/admin/flash-sales/${id}`);
    return response.data.data;
  },

  updateProductFeature: async ({ productId, payload }: { productId: string; payload: { isFeatured?: boolean; isTrending?: boolean; isNewArrival?: boolean } }) => {
    const response = await axiosInstance.patch(`/admin/products/${productId}/feature`, payload);
    return response.data.data;
  },

  getWarehouses: async (params: AdminListParams): Promise<PaginatedAdminResult<Warehouse>> => {
    const response = await axiosInstance.get("/admin/warehouses", { params });
    return response.data.data;
  },

  createWarehouse: async (payload: Partial<Warehouse>): Promise<Warehouse> => {
    const response = await axiosInstance.post("/admin/warehouses", payload);
    return response.data.data;
  },

  updateWarehouse: async ({ id, payload }: { id: string; payload: Partial<Warehouse> }): Promise<Warehouse> => {
    const response = await axiosInstance.patch(`/admin/warehouses/${id}`, payload);
    return response.data.data;
  },

  deleteWarehouse: async (id: string): Promise<Warehouse> => {
    const response = await axiosInstance.delete(`/admin/warehouses/${id}`);
    return response.data.data;
  },

  getShippingProviders: async (params: AdminListParams): Promise<PaginatedAdminResult<ShippingProvider>> => {
    const response = await axiosInstance.get("/admin/shipping-providers", { params });
    return response.data.data;
  },

  createShippingProvider: async (payload: Partial<ShippingProvider>): Promise<ShippingProvider> => {
    const response = await axiosInstance.post("/admin/shipping-providers", payload);
    return response.data.data;
  },

  updateShippingProvider: async ({ id, payload }: { id: string; payload: Partial<ShippingProvider> }): Promise<ShippingProvider> => {
    const response = await axiosInstance.patch(`/admin/shipping-providers/${id}`, payload);
    return response.data.data;
  },

  deleteShippingProvider: async (id: string): Promise<ShippingProvider> => {
    const response = await axiosInstance.delete(`/admin/shipping-providers/${id}`);
    return response.data.data;
  },

  getInventory: async (params: AdminListParams): Promise<InventoryResponse> => {
    const response = await axiosInstance.get("/admin/inventory", { params });
    return response.data.data;
  },

  updateInventoryStock: async (payload: { productId: string; sku: string; stock: number; reason?: string }) => {
    const response = await axiosInstance.patch("/admin/inventory/stock", payload);
    return response.data.data;
  },

  getReports: async (params: AdminListParams): Promise<AdminReports> => {
    const response = await axiosInstance.get("/admin/reports", { params });
    return response.data.data;
  },

  getActivityLogs: async (params: AdminListParams): Promise<PaginatedAdminResult<AdminLog>> => {
    const response = await axiosInstance.get("/admin/activity-logs", { params });
    return response.data.data;
  },

  getAuditLogs: async (params: AdminListParams): Promise<PaginatedAdminResult<AdminLog>> => {
    const response = await axiosInstance.get("/admin/audit-logs", { params });
    return response.data.data;
  },

  getSystemConfig: async (): Promise<AdminSystemConfig> => {
    const response = await axiosInstance.get("/admin/system-config");
    return response.data.data;
  },

  updateSystemConfig: async (payload: AdminSystemConfig): Promise<AdminSystemConfig> => {
    const response = await axiosInstance.patch("/admin/system-config", payload);
    return response.data.data;
  },

  getBackups: async (params: AdminListParams): Promise<PaginatedAdminResult<BackupJob>> => {
    const response = await axiosInstance.get("/admin/backups", { params });
    return response.data.data;
  },

  createBackup: async (payload: { name?: string; collections?: string[] }): Promise<BackupJob> => {
    const response = await axiosInstance.post("/admin/backups", payload);
    return response.data.data;
  },

  dryRunRestore: async (id: string) => {
    const response = await axiosInstance.post(`/admin/backups/${id}/restore-dry-run`);
    return response.data.data;
  },

  restoreBackup: async (id: string) => {
    const response = await axiosInstance.post(`/admin/backups/${id}/restore`, { confirm: "RESTORE" });
    return response.data.data;
  },

  getPolicies: async (params: AdminListParams): Promise<PaginatedAdminResult<Policy>> => {
    const response = await axiosInstance.get("/admin/policies", { params });
    return response.data.data;
  },

  createPolicy: async (payload: PolicyPayload): Promise<Policy> => {
    const response = await axiosInstance.post("/admin/policies", payload);
    return response.data.data;
  },

  updatePolicy: async ({ id, payload }: { id: string; payload: PolicyPayload }): Promise<Policy> => {
    const response = await axiosInstance.patch(`/admin/policies/${id}`, payload);
    return response.data.data;
  },

  deletePolicy: async (id: string): Promise<Policy> => {
    const response = await axiosInstance.delete(`/admin/policies/${id}`);
    return response.data.data;
  },

  getSellers: async (params: AdminListParams): Promise<ManagedPerson[]> => {
    const response = await axiosInstance.get("/admin/sellers", { params });
    return response.data.data;
  },

  getSeller: async (id: string): Promise<ManagedPerson> => {
    const response = await axiosInstance.get(`/admin/sellers/${id}`);
    return response.data.data;
  },

  getSellerInsights: async ({ id, params }: { id: string; params: AdminListParams }): Promise<PartnerInsight> => {
    const response = await axiosInstance.get(`/admin/sellers/${id}/insights`, { params });
    return response.data.data;
  },

  getRiders: async (params: AdminListParams): Promise<ManagedPerson[]> => {
    const response = await axiosInstance.get("/admin/riders", { params });
    return response.data.data;
  },

  getRider: async (id: string): Promise<ManagedPerson> => {
    const response = await axiosInstance.get(`/admin/riders/${id}`);
    return response.data.data;
  },

  getRiderInsights: async ({ id, params }: { id: string; params: AdminListParams }): Promise<PartnerInsight> => {
    const response = await axiosInstance.get(`/admin/riders/${id}/insights`, { params });
    return response.data.data;
  },

  createSeller: async (payload: SellerPayload): Promise<ManagedPerson> => {
    const response = await axiosInstance.post("/admin/sellers", payload);
    return response.data.data;
  },

  updateSeller: async ({ id, payload }: { id: string; payload: Partial<SellerPayload> }): Promise<ManagedPerson> => {
    const response = await axiosInstance.patch(`/admin/sellers/${id}`, payload);
    return response.data.data;
  },

  deleteSeller: async (id: string): Promise<ManagedPerson> => {
    const response = await axiosInstance.delete(`/admin/sellers/${id}`);
    return response.data.data;
  },

  getAdminSubOrders: async (params: AdminListParams & { sellerId?: string; riderId?: string }): Promise<PaginatedAdminResult<AdminSubOrder>> => {
    const response = await axiosInstance.get("/orders/admin/sub-orders", { params });
    return response.data.data;
  },

  adminAssignRider: async ({ subOrderId, riderUserId }: { subOrderId: string; riderUserId: string }) => {
    const response = await axiosInstance.post(`/orders/admin/sub-orders/${subOrderId}/assign`, { riderUserId });
    return response.data.data;
  },

  adminSettleCod: async (subOrderId: string) => {
    const response = await axiosInstance.post(`/orders/admin/sub-orders/${subOrderId}/cod-settle`);
    return response.data.data;
  },

  settleRiderCod: async ({ riderId, amount, referenceId, note }: { riderId: string; amount: number; referenceId?: string; note?: string }) => {
    const response = await axiosInstance.post(`/admin/delivery/${riderId}/settle-cod`, { amount, referenceId, note });
    return response.data.data;
  },
};
