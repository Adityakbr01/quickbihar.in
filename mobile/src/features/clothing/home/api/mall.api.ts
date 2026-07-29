import axiosInstance from "@/src/api/axiosInstance";

export interface TopMall {
  _id?: string;
  id: string;
  name: string;
  location: string;
  rating: number;
  image: string;
  tagline: string;
  sellerCount?: number;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  description?: string;
}

export const getTopMallsRequest = async (): Promise<TopMall[]> => {
  const response = await axiosInstance.get("/malls/top");
  return response.data.data || [];
};

export const getPublicMallsRequest = async (): Promise<TopMall[]> => {
  const response = await axiosInstance.get("/malls");
  return response.data.data || [];
};

export const getMallDetailRequest = async (id: string): Promise<any> => {
  const response = await axiosInstance.get(`/malls/${id}`);
  return response.data.data;
};

export const postMallReviewRequest = async (id: string, payload: { rating: number; comment?: string }): Promise<any> => {
  const response = await axiosInstance.post(`/malls/${id}/reviews`, payload);
  return response.data.data;
};
