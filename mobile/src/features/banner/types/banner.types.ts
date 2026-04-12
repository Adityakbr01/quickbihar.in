export interface Banner {
  _id: string;
  title?: string;
  subtitle?: string;
  image: string;
  redirectType: "product" | "category" | "collection" | "external";
  redirectId?: string;
  externalUrl?: string;
  placement: "home_top" | "home_middle" | "category";
  priority: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  clicks: number;
  impressions: number;
  isAds: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateBannerData = Omit<Banner, "_id" | "clicks" | "impressions" | "createdAt" | "updatedAt">;
export type UpdateBannerData = Partial<CreateBannerData>;
