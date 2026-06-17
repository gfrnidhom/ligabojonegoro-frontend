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

export default api;
