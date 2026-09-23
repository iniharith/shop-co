import AxiosInstance from '@/utils/axios';

export const getCatalog = async (token: string) => (await AxiosInstance(token).get('/api/admin/catalog')).data;
export const getCatalogAnalytics = async (token: string) => (await AxiosInstance(token).get('/api/admin/catalog/analytics')).data;
export const getCatalogProduct = async (token: string, id: string) => (await AxiosInstance(token).get(`/api/admin/catalog/${id}`)).data;
export const createCatalogProduct = async (token: string, payload: unknown) => (await AxiosInstance(token).post('/api/admin/catalog', payload)).data;
export const updateCatalogProduct = async (token: string, id: string, payload: unknown) => (await AxiosInstance(token).patch(`/api/admin/catalog/${id}`, payload)).data;
export const archiveCatalogProduct = async (token: string, id: string, archived: boolean) => (await AxiosInstance(token).patch(`/api/admin/catalog/${id}/archive`, { archived })).data;
export const bulkArchiveCatalog = async (token: string, ids: string[], archived: boolean) => (await AxiosInstance(token).post('/api/admin/catalog/bulk/archive', { ids, archived })).data;
export const bulkDeleteCatalog = async (token: string, ids: string[], confirmation: string) => (await AxiosInstance(token).delete('/api/admin/catalog/bulk', { data: { ids, confirmation } })).data;
export const getCatalogImageUploadUrl = async (token: string, fileName: string, contentType: string) => (await AxiosInstance(token).post('/api/admin/catalog/image-upload-url', { fileName, contentType })).data;
export const adjustCatalogStock = async (token: string, id: string, payload: { size: string; stock: number }) => (await AxiosInstance(token).post(`/api/admin/catalog/${id}/stock-adjustments`, payload)).data;
export const getCatalogStockAdjustments = async (token: string, id: string, page = 1) => (await AxiosInstance(token).get(`/api/admin/catalog/${id}/stock-adjustments`, { params: { page, limit: 50 } })).data;
