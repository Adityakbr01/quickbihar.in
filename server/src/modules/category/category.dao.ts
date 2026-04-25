// category.dao.ts
import { Category, CategoryAttribute } from "./category.model";
import type { CreateCategoryInput, CreateAttributeInput, UpdateAttributeInput } from "./category.types";

export const createCategoryDAO = (data: CreateCategoryInput & { image: string, imagePublicId: string }) => Category.create(data);

export const getCategoriesDAO = () => Category.find();

export const createAttributeDAO = (data: CreateAttributeInput) => CategoryAttribute.create(data);

export const getAttributesByCategoryDAO = (categoryId: string) =>
    CategoryAttribute.find({ categoryId });

export const updateCategoryDAO = (categoryId: string, data: Partial<CreateCategoryInput & { image: string, imagePublicId: string }>) =>
    Category.findByIdAndUpdate(categoryId, data, { new: true });

export const updateAttributeDAO = (attributeId: string, data: UpdateAttributeInput) =>
    CategoryAttribute.findByIdAndUpdate(attributeId, data, { new: true });