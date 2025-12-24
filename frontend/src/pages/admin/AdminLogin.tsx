import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { LoginResponse } from '../../types';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { adminToken, setAdminAuth, _hasHydrated } = useAuthStore();

  // 이미 로그인되어 있으면 대시보드로 이동
  useEffect(() => {
    if (_hasHydrated && adminToken) {
      navigate('/admin/dashboard/status', { replace: true });
    }
  }, [_hasHydrated, adminToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast.error('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Attempting login with:', { username });
      const response = await api.post<LoginResponse>('/auth/admin/login', { 
        username, 
        password 
      });
      console.log('Login response:', response.data);
      const { access_token, admin } = response.data;
      
      if (access_token && admin) {
        console.log('Setting auth and navigating...');
        setAdminAuth(access_token, admin);
        toast.success(`${admin.name}님 환영합니다!`);
        // 직접 페이지 이동
        navigate('/admin/dashboard/status');
      } else {
        console.log('Invalid response:', response.data);
        toast.error('로그인 응답이 올바르지 않습니다.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      toast.error(error.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">관리자 로그인</h1>
          <p className="text-gray-600 mt-2">기숙사 외박/귀사 관리 시스템</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              아이디
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              placeholder="아이디를 입력하세요"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/student/login"
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            ← 학생 로그인으로
          </Link>
        </div>
      </div>
    </div>
  );
}
