import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { LeaveRequest, Student } from '../../types';

interface StudentMeResponse {
  student: Student;
  activeLeave: LeaveRequest | null;
  hasActiveLeave: boolean;
}

export default function StudentHome() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { student, clearStudentAuth } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  
  // 폼 상태
  const [leaveStart, setLeaveStart] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [reason, setReason] = useState('');

  // 학생 정보 및 활성 외박 조회
  const { data, isLoading, refetch } = useQuery<StudentMeResponse>({
    queryKey: ['studentMe'],
    queryFn: async () => {
      const response = await api.get('/student/me');
      return response.data;
    },
  });

  // 외박 신청
  const applyMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/leave-request', {
        leaveStart,
        expectedReturn,
        reason,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('외박 신청이 완료되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['studentMe'] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '신청에 실패했습니다.');
    },
  });

  // 외박 수정
  const updateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.put(`/leave-request/${id}`, {
        leaveStart,
        expectedReturn,
        reason,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('외박 정보가 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['studentMe'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '수정에 실패했습니다.');
    },
  });

  // 외박 삭제
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/leave-request/${id}`);
    },
    onSuccess: () => {
      toast.success('외박 신청이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['studentMe'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '삭제에 실패했습니다.');
    },
  });

  // 귀사 완료
  const returnMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post(`/leave-request/${id}/return`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('귀사 처리가 완료되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['studentMe'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '귀사 처리에 실패했습니다.');
    },
  });

  const resetForm = () => {
    setLeaveStart('');
    setExpectedReturn('');
    setReason('');
    setIsEditing(false);
  };

  const handleLogout = () => {
    clearStudentAuth();
    navigate('/student/login');
  };

  const handleEdit = () => {
    if (data?.activeLeave) {
      setLeaveStart(format(new Date(data.activeLeave.leaveStart), "yyyy-MM-dd'T'HH:mm"));
      setExpectedReturn(format(new Date(data.activeLeave.expectedReturn), "yyyy-MM-dd'T'HH:mm"));
      setReason(data.activeLeave.reason);
      setIsEditing(true);
    }
  };

  const handleDelete = () => {
    if (data?.activeLeave && confirm('정말 외박 신청을 삭제하시겠습니까?')) {
      deleteMutation.mutate(data.activeLeave.id);
    }
  };

  const handleReturn = () => {
    if (data?.activeLeave && confirm('귀사 완료 처리하시겠습니까?')) {
      returnMutation.mutate(data.activeLeave.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leaveStart || !expectedReturn || !reason.trim()) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }

    if (new Date(expectedReturn) <= new Date(leaveStart)) {
      toast.error('귀사예정일시는 외박일시 이후여야 합니다.');
      return;
    }

    if (isEditing && data?.activeLeave) {
      updateMutation.mutate(data.activeLeave.id);
    } else {
      applyMutation.mutate();
    }
  };

  const isOverdue = (leave: LeaveRequest) => {
    return new Date(leave.expectedReturn) < new Date();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  const activeLeave = data?.activeLeave;
  const studentInfo = data?.student || student;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-800">{studentInfo?.name}님</h1>
            <p className="text-sm text-gray-600">{studentInfo?.roomNo}호</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* 상태 표시 */}
        <div className={`card mb-6 ${activeLeave ? 'border-l-4 border-yellow-500' : 'border-l-4 border-green-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className={`badge ${activeLeave ? 'badge-warning' : 'badge-success'}`}>
                {activeLeave ? '외박 중' : '기숙사 내'}
              </span>
              {activeLeave && isOverdue(activeLeave) && (
                <span className="badge badge-danger ml-2">귀사예정 초과</span>
              )}
            </div>
            {activeLeave && (
              <div className="text-sm text-gray-500">
                귀사예정: {format(new Date(activeLeave.expectedReturn), 'M/d HH:mm', { locale: ko })}
              </div>
            )}
          </div>
        </div>

        {/* 외박 중일 때 */}
        {activeLeave && !isEditing ? (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">외박 정보</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">외박일시</label>
                <p className="font-medium">
                  {format(new Date(activeLeave.leaveStart), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                </p>
              </div>
              
              <div>
                <label className="text-sm text-gray-500">귀사예정일시</label>
                <p className={`font-medium ${isOverdue(activeLeave) ? 'text-red-600' : ''}`}>
                  {format(new Date(activeLeave.expectedReturn), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                </p>
              </div>
              
              <div>
                <label className="text-sm text-gray-500">사유</label>
                <p className="font-medium">{activeLeave.reason}</p>
              </div>

              <div>
                <label className="text-sm text-gray-500">보호자 연락처</label>
                <p className="font-medium">{studentInfo?.guardianPhone}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <button
                onClick={handleReturn}
                disabled={returnMutation.isPending}
                className="btn btn-success"
              >
                귀사 완료
              </button>
              <button
                onClick={handleEdit}
                className="btn btn-secondary"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="btn btn-danger"
              >
                삭제
              </button>
            </div>
          </div>
        ) : (
          /* 신청/수정 폼 */
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">
              {isEditing ? '외박 정보 수정' : '외박 신청'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 자동 입력 필드 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">학번</label>
                  <input
                    type="text"
                    value={studentInfo?.hakbun || ''}
                    className="input input-readonly"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                  <input
                    type="text"
                    value={studentInfo?.name || ''}
                    className="input input-readonly"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">호실</label>
                  <input
                    type="text"
                    value={studentInfo?.roomNo || ''}
                    className="input input-readonly"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">보호자 연락처</label>
                  <input
                    type="text"
                    value={studentInfo?.guardianPhone || ''}
                    className="input input-readonly"
                    readOnly
                  />
                </div>
              </div>

              {/* 사용자 입력 필드 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  외박일시 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={leaveStart}
                  onChange={(e) => setLeaveStart(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  귀사예정일시 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input min-h-[100px]"
                  placeholder="외박 사유를 입력하세요"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={applyMutation.isPending || updateMutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  {isEditing ? '수정하기' : '신청하기'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn btn-secondary"
                  >
                    취소
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
