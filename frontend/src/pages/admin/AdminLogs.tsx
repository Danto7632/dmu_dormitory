import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import api from '../../lib/api';
import AdminLayout from '../../components/layout/AdminLayout';
import LogDetailModal from '../../components/modals/LogDetailModal';
import { AuditLog, ActionType, PaginatedResponse } from '../../types';

const ACTION_LABELS: Record<ActionType, { label: string; color: string }> = {
  APPLY: { label: '신청', color: 'badge-info' },
  EDIT: { label: '수정', color: 'badge-warning' },
  DELETE: { label: '삭제', color: 'badge-danger' },
  RETURN: { label: '귀사', color: 'badge-success' },
};

export default function AdminLogs() {
  const [page, setPage] = useState(1);
  const [actionType, setActionType] = useState<ActionType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // 로그 상세 모달 상태
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery<PaginatedResponse<AuditLog>>({
    queryKey: ['adminLogs', page, actionType, searchQuery, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (actionType) params.append('actionType', actionType);
      if (searchQuery) params.append('search', searchQuery);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/admin/logs?${params.toString()}`);
      return response.data;
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / 20);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleReset = () => {
    setActionType('');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const setQuickDate = (type: 'today' | 'week') => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    if (type === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      setStartDate(format(weekAgo, 'yyyy-MM-dd'));
      setEndDate(todayStr);
    }
    setPage(1);
  };

  const handleLogClick = (logId: number) => {
    setSelectedLogId(logId);
    setIsModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">검색 필터</h2>
        
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이벤트 타입
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as ActionType | '')}
                className="input"
              >
                <option value="">전체</option>
                <option value="APPLY">신청</option>
                <option value="EDIT">수정</option>
                <option value="DELETE">삭제</option>
                <option value="RETURN">귀사</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                학번/이름/호실
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                placeholder="검색어 입력"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시작일
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                종료일
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setQuickDate('today')}
              className="btn btn-secondary text-sm"
            >
              오늘
            </button>
            <button
              type="button"
              onClick={() => setQuickDate('week')}
              className="btn btn-secondary text-sm"
            >
              이번 주
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary text-sm"
            >
              초기화
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            전체 로그 <span className="text-gray-500 text-sm font-normal">({data?.total || 0}건)</span>
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-12 text-gray-500">로그가 없습니다.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">시간</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">이벤트</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">학번</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">이름</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">호실</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => handleLogClick(log.id)}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${ACTION_LABELS[log.actionType].color}`}>
                          {ACTION_LABELS[log.actionType].label}
                        </span>
                      </td>
                      <td className="py-3 px-4">{log.student?.hakbun || log.actorHakbun}</td>
                      <td className="py-3 px-4 font-medium">{log.student?.name || '-'}</td>
                      <td className="py-3 px-4">{log.student?.roomNo || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary"
                >
                  이전
                </button>
                <span className="text-sm text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn btn-secondary"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 로그 상세 모달 */}
      <LogDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLogId(null);
        }}
        logId={selectedLogId}
      />
    </AdminLayout>
  );
}
