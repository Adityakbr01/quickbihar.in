import { useQuery } from "@tanstack/react-query";
import { getPublicCategoriesRequest } from "../api/category.api";
import { Category } from "../types/category.types";

export const useCategories = () => {
    return useQuery<Category[], Error>({
        queryKey: ["categories", "public"],
        queryFn: getPublicCategoriesRequest,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
};
