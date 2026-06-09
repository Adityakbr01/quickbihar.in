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
}

export const getTopMallsRequest = async (): Promise<TopMall[]> => {
  const response = await axiosInstance.get("/malls/top");
  return response.data.data || [];
};
