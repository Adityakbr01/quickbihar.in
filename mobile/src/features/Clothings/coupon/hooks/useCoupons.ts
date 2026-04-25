import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    getAllCouponsRequest, 
    createCouponRequest, 
    updateCouponRequest, 
    deleteCouponRequest,
    validateCouponRequest
} from "../api/coupon.api";
import { ICoupon } from "../types/coupon.types";

export const useCoupons = () => {
    return useQuery<ICoupon[], Error>({
        queryKey: ["coupons"],
        queryFn: getAllCouponsRequest,
    });
};

export const useCreateCoupon = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createCouponRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coupons"] });
        },
    });
};

export const useUpdateCoupon = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateCouponRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coupons"] });
        },
    });
};

export const useDeleteCoupon = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteCouponRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coupons"] });
        },
    });
};

export const useValidateCoupon = () => {
    return useMutation({
        mutationFn: ({ code, orderAmount }: { code: string, orderAmount: number }) => 
            validateCouponRequest(code, orderAmount),
    });
};
