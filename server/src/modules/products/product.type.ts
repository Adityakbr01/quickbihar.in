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

    images: string[];

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
        estimatedDays: number;
    };

    isActive: boolean;
    isDeleted: boolean;

    createdAt: Date;
    updatedAt: Date;
}