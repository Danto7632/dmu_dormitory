import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: '/dormitory/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    // 로그인 요청은 토큰이 필요 없음
    if (config.url?.includes('/auth/')) {
      return config;
    }
    
    const { studentToken, adminToken } = useAuthStore.getState();
    
    // admin 경로면 admin 토큰, 아니면 student 토큰 사용
    const isAdminRoute = config.url?.includes('/admin') || config.url?.includes('/upload') || config.url?.includes('/audit-log');
    const token = isAdminRoute ? adminToken : studentToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 로그인 요청의 401은 무시 (자격 증명 오류)
    if (error.config?.url?.includes('/auth/')) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      const isAdminRoute = error.config?.url?.includes('/admin');
      
      if (isAdminRoute) {
        useAuthStore.getState().clearAdminAuth();
        window.location.href = '/admin/login';
      } else {
        useAuthStore.getState().clearStudentAuth();
        window.location.href = '/student/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
