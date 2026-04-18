export interface IVariant {
    size: string;
    color: string;
    stock: number;
    sku: string;
}

export interface IProduct {
    title: string;
    slug: string;
    description?: string;

    brand?: string;

    category: string;
    subCategory?: string;

    price: number;
    originalPrice?: number;
    discountPercentage?: number;

    currency: string;
 
     isGstApplicable: boolean;
     gstPercentage: number;
 
     images: { url: string; fileId: string }[];

    sellerId: string; // reference to user

    variants: IVariant[];
    totalStock: number;

    ratings: {
        average: number;
        count: number;
    };

    sizeChartId?: string; // reference to size chart

    details?: {
        fit?: string;
        pattern?: string;
        material?: string;
        collar?: string;
        sleeve?: string;
        washCare?: string;
        sku?: string;
    };

    tags?: string[];

    isFeatured?: boolean;
    isTrending?: boolean;
    isNewArrival?: boolean;

    deliveryInfo?: {
        isExpressAvailable: boolean;
        isCodAvailable: boolean;
        estimatedDays: number;
        returnPolicy?: string;
    };

    compliance?: {
        manufacturerDetail?: string;
        packerDetail?: string;
        countryOfOrigin: string;
    };

    logistics?: {
        pickupLocation?: string;
        warehouseName?: string;
        latitude?: number;
        longitude?: number;
    };

    isActive: boolean;
    isDeleted: boolean;
 
     refundPolicy?: string;
 
     createdAt: Date;
    updatedAt: Date;
}