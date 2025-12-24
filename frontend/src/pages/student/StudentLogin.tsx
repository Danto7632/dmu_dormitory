import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { LoginResponse } from '../../types';

export default function StudentLogin() {
  const [hakbun, setHakbun] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { studentToken, setStudentAuth, _hasHydrated } = useAuthStore();

  // 이미 로그인되어 있으면 홈으로 이동
  useEffect(() => {
    if (_hasHydrated && studentToken) {
      navigate('/student/home', { replace: true });
    }
  }, [_hasHydrated, studentToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hakbun.trim()) {
      toast.error('학번을 입력해주세요.');
      return;
    }

    if (!password.trim()) {
      toast.error('비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.post<LoginResponse>('/auth/student/login', { 
        hakbun, 
        password 
      });
      const { access_token, student } = response.data;
      
      if (access_token && student) {
        setStudentAuth(access_token, student);
        toast.success(`${student.name}님 환영합니다!`);
        window.location.href = '/student/home';
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">기숙사 외박/귀사 신고</h1>
          <p className="text-gray-600 mt-2">학번과 비밀번호를 입력하여 로그인하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="hakbun" className="block text-sm font-medium text-gray-700 mb-2">
              학번
            </label>
            <input
              type="text"
              id="hakbun"
              value={hakbun}
              onChange={(e) => setHakbun(e.target.value)}
              className="input"
              placeholder="학번을 입력하세요"
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
            <p className="mt-1 text-xs text-gray-500">
              기본 비밀번호: 방번호(3자리) + 전화번호 뒷자리(4자리)
            </p>
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
          <a
            href="/admin/login"
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            관리자 로그인 →
          </a>
        </div>
      </div>
    </div>
  );
}
