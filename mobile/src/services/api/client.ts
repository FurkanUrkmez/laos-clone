import axios from 'axios';
import { getCurrentAccessToken } from './tokenStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = getCurrentAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
