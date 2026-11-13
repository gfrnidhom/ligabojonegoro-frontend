import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://app.ligabojonegoro.id/api/v1/';
export const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || 'https://app.ligabojonegoro.id/storage/';

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${STORAGE_URL}${cleanPath}`;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Fetch every page of /matches (backend paginates, newest first).
 * Returns the same shape as a single page response: { data: { success, data } }.
 */
export const fetchAllMatches = async (params = {}) => {
  const perPage = 200;
  const first = await api.get('/matches', { params: { ...params, per_page: perPage, page: 1 } });
  if (!first.data?.success) return first;
  const lastPage = first.data.meta?.last_page || 1;
  let all = [...(first.data.data || [])];
  if (lastPage > 1) {
    const rest = await Promise.all(
      Array.from({ length: lastPage - 1 }, (_, i) =>
        api.get('/matches', { params: { ...params, per_page: perPage, page: i + 2 } })
      )
    );
    rest.forEach(r => { all = all.concat(r.data?.data || []); });
  }
  return { ...first, data: { ...first.data, data: all } };
};

export default api;
