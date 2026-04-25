export interface Category {
    _id: string;
    title: string;
    slug: string;
    image: string;
    imagePublicId: string;
    priority: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export type CreateCategoryData = Omit<Category, "_id" | "slug" | "createdAt" | "updatedAt">;
export type UpdateCategoryData = Partial<CreateCategoryData>;
