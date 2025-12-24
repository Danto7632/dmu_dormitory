import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import { ko } from 'date-fns/locale';
import api from '../../lib/api';
import AdminLayout from '../../components/layout/AdminLayout';
import { DashboardStatus, LeaveRequest } from '../../types';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [inDormSearch, setInDormSearch] = useState('');
  const [onLeaveSearch, setOnLeaveSearch] = useState('');

  const { data: status, isLoading } = useQuery<DashboardStatus>({
    queryKey: ['dashboardStatus'],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard/status');
      return response.data;
    },
    refetchInterval: 30000, // 30초마다 자동 갱신
  });

  const isOverdue = (leave: LeaveRequest) => {
    return new Date(leave.expectedReturn) < new Date();
  };

  const getOverdueTime = (leave: LeaveRequest) => {
    const now = new Date();
    const expected = new Date(leave.expectedReturn);
    const hours = differenceInHours(now, expected);
    const minutes = differenceInMinutes(now, expected) % 60;
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분 초과`;
    }
    return `${minutes}분 초과`;
  };

  // 기숙사 내 학생 필터링
  const filteredInDormList = status?.inDormList?.filter((student) => {
    if (!inDormSearch) return true;
    return (
      student.name?.includes(inDormSearch) ||
      student.hakbun?.includes(inDormSearch) ||
      student.roomNo?.includes(inDormSearch)
    );
  }) || [];

  // 외박 중 학생 필터링
  const filteredOnLeaveList = status?.onLeaveList?.filter((leave) => {
    if (!onLeaveSearch) return true;
    return (
      leave.student?.name?.includes(onLeaveSearch) ||
      leave.student?.hakbun?.includes(onLeaveSearch) ||
      leave.student?.roomNo?.includes(onLeaveSearch)
    );
  }) || [];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* 통계 카드 - 2개만 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">기숙사 내</p>
              <p className="text-3xl font-bold text-green-600">{status?.inDorm || 0}명</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏠</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">외박 중</p>
              <p className="text-3xl font-bold text-yellow-600">
                {status?.onLeave || 0}명
                {(status?.overdue || 0) > 0 && (
                  <span className="text-sm text-red-500 ml-2">
                    (초과 {status?.overdue}명)
                  </span>
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🌙</span>
            </div>
          </div>
        </div>
      </div>

      {/* 학생 목록 - 반반 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 기숙사 내 학생 */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              기숙사 내 학생
              <span className="text-sm text-gray-500 font-normal">({filteredInDormList.length}명)</span>
            </h2>
            <input
              type="text"
              placeholder="검색..."
              value={inDormSearch}
              onChange={(e) => setInDormSearch(e.target.value)}
              className="input w-full sm:w-48 text-sm"
            />
          </div>

          <div className="overflow-y-auto max-h-96">
            {filteredInDormList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                기숙사 내 학생이 없습니다.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">학번</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">이름</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">층</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">호실</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInDormList.map((student) => (
                    <tr
                      key={student.hakbun}
                      onClick={() => navigate(`/admin/students/${student.hakbun}`)}
                      className="border-b hover:bg-green-50 cursor-pointer"
                    >
                      <td className="py-2 px-3">{student.hakbun}</td>
                      <td className="py-2 px-3 font-medium">{student.name}</td>
                      <td className="py-2 px-3">{student.floor}층</td>
                      <td className="py-2 px-3">{student.roomNo}호</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 외박 중 학생 */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              외박 중 학생
              <span className="text-sm text-gray-500 font-normal">({filteredOnLeaveList.length}명)</span>
            </h2>
            <input
              type="text"
              placeholder="검색..."
              value={onLeaveSearch}
              onChange={(e) => setOnLeaveSearch(e.target.value)}
              className="input w-full sm:w-48 text-sm"
            />
          </div>

          <div className="overflow-y-auto max-h-96">
            {filteredOnLeaveList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                외박 중인 학생이 없습니다.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">학번</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">이름</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">호실</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">귀사예정</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOnLeaveList.map((leave) => {
                    const overdue = isOverdue(leave);
                    return (
                      <tr
                        key={leave.id}
                        onClick={() => navigate(`/admin/students/${leave.student?.hakbun}`)}
                        className={`border-b cursor-pointer transition-colors ${
                          overdue 
                            ? 'bg-red-50 hover:bg-red-100' 
                            : 'hover:bg-yellow-50'
                        }`}
                      >
                        <td className={`py-2 px-3 ${overdue ? 'text-red-700' : ''}`}>
                          {leave.student?.hakbun}
                        </td>
                        <td className={`py-2 px-3 font-medium ${overdue ? 'text-red-700' : ''}`}>
                          {leave.student?.name}
                        </td>
                        <td className={`py-2 px-3 ${overdue ? 'text-red-700' : ''}`}>
                          {leave.student?.roomNo}호
                        </td>
                        <td className={`py-2 px-3 ${overdue ? 'text-red-700' : ''}`}>
                          {format(new Date(leave.expectedReturn), 'M/d HH:mm', { locale: ko })}
                        </td>
                        <td className="py-2 px-3">
                          {overdue ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              ⚠️ {getOverdueTime(leave)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              정상
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
