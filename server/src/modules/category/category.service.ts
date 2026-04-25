import { Category, CategoryAttribute } from "./category.model";
import { createCategoryDAO, getCategoriesDAO, createAttributeDAO, getAttributesByCategoryDAO, updateCategoryDAO, updateAttributeDAO } from "./category.dao";
import type { CreateCategoryInput, CreateAttributeInput, UpdateCategoryInput, UpdateAttributeInput } from "./category.types";

export const createCategoryService = async (
    data: CreateCategoryInput,
    image: string,
    imagePublicId: string
) => {
    return await createCategoryDAO({ ...data, image, imagePublicId });
};

export const getCategoriesService = async (parentId?: string) => {
    // If parentId is not provided or is "null", fetch root categories
    const query = (!parentId || parentId === "null") ? { parentId: null } : { parentId };
    return await Category.find(query).sort({ name: 1 });
};

export const getCategoryTreeService = async () => {
    return await Category.find().lean();
};

export const createAttributeService = async (data: CreateAttributeInput) => {
    return await createAttributeDAO(data);
};

export const getAttributesService = async (categoryId: string) => {
    return await getAttributesByCategoryDAO(categoryId);
};

export const updateCategoryService = async (
    categoryId: string,
    data: UpdateCategoryInput,
    image?: string,
    imagePublicId?: string
) => {
    const updateData: any = { ...data };
    if (image && imagePublicId) {
        updateData.image = image;
        updateData.imagePublicId = imagePublicId;
    }
    return await updateCategoryDAO(categoryId, updateData);
};

export const updateAttributeService = async (attributeId: string, data: UpdateAttributeInput) => {
    return await updateAttributeDAO(attributeId, data);
};

export const getCategoryByIdService = async (categoryId: string) => {
    return await Category.findById(categoryId);
};
