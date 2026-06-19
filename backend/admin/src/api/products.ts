import AxiosInstance from "@/utils/axios";

export const getProducts = async (token: string) => {
    const response = await AxiosInstance(token).get(`/api/product`);
    return response.data;
}
