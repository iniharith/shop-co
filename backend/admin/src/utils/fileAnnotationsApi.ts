import AxiosInstance from './axios';

export async function fileAnnotationsApi(token: string, method: 'GET' | 'POST' | 'PUT', path: string, body?: unknown) {
  const response = await AxiosInstance(token).request({ method, url: `/api/file-annotations${path}`, data: body });
  return response.data.data;
}
