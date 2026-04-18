import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    getAllRefundPoliciesRequest, 
    createRefundPolicyRequest, 
    updateRefundPolicyRequest, 
    deleteRefundPolicyRequest 
} from "../api/refundPolicy.api";
import { IRefundPolicy } from "../../product/types/product.types";

export const useAdminRefundPolicies = () => {
  return useQuery<{ data: IRefundPolicy[] }, Error>({
    queryKey: ["refundPolicies", "admin"],
    queryFn: getAllRefundPoliciesRequest,
  });
};

export const useCreateRefundPolicy = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createRefundPolicyRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["refundPolicies"] });
        },
    });
};

export const useUpdateRefundPolicy = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateRefundPolicyRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["refundPolicies"] });
        },
    });
};

export const useDeleteRefundPolicy = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteRefundPolicyRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["refundPolicies"] });
        },
    });
};
