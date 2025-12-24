import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface AdminGuardProps {
  children: ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { adminToken, _hasHydrated } = useAuthStore();
  
  // hydration이 완료될 때까지 로딩 표시
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }
  
  if (!adminToken) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
}
