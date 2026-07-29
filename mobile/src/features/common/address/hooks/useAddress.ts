import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  createAddressRequest, 
  deleteAddressRequest, 
  getAddressesRequest, 
  setDefaultAddressRequest, 
  updateAddressRequest 
} from "../api/address.api";
import { AddressFormValues, IAddress } from "../schema/address.schema";

export const useAddresses = () => {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: getAddressesRequest,
    select: (response) => response.data as IAddress[],
  });
};

export const useAddressActions = () => {
  const queryClient = useQueryClient();

  const createAddress = useMutation({
    mutationFn: createAddressRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  const updateAddress = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddressFormValues }) =>
      updateAddressRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  const deleteAddress = useMutation({
    mutationFn: deleteAddressRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  const setDefaultAddress = useMutation({
    mutationFn: setDefaultAddressRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  return {
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    isPending:
      createAddress.isPending ||
      updateAddress.isPending ||
      deleteAddress.isPending ||
      setDefaultAddress.isPending,
  };
};
