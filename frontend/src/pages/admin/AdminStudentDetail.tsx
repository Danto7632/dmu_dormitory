import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import api from '../../lib/api';
import AdminLayout from '../../components/layout/AdminLayout';
import LogDetailModal from '../../components/modals/LogDetailModal';
import { Student, LeaveRequest, AuditLog, ActionType } from '../../types';

interface StudentDetailResponse {
  student: Student;
  activeLeave: LeaveRequest | null;
  recentLeaves: LeaveRequest[];
  logs: AuditLog[];
}

const ACTION_LABELS: Record<ActionType, { label: string; color: string }> = {
  APPLY: { label: '신청', color: 'badge-info' },
  EDIT: { label: '수정', color: 'badge-warning' },
  DELETE: { label: '삭제', color: 'badge-danger' },
  RETURN: { label: '귀사', color: 'badge-success' },
};

export default function AdminStudentDetail() {
  const { hakbun } = useParams<{ hakbun: string }>();
  const navigate = useNavigate();
  
  // 로그 상세 모달 상태
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery<StudentDetailResponse>({
    queryKey: ['studentDetail', hakbun],
    queryFn: async () => {
      const response = await api.get(`/admin/students/${hakbun}`);
      return response.data;
    },
    enabled: !!hakbun,
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">학생 정보를 찾을 수 없습니다.</p>
          <button onClick={() => navigate(-1)} className="btn btn-primary">
            뒤로가기
          </button>
        </div>
      </AdminLayout>
    );
  }

  const { student, activeLeave, recentLeaves, logs } = data;
  const isOnLeave = !!activeLeave;
  const isOverdue = activeLeave && new Date(activeLeave.expectedReturn) < new Date();

  return (
    <AdminLayout>
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate(-1)}
        className="text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
      >
        ← 뒤로가기
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 학생 기본정보 */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">학생 정보</h2>
              <span className={`badge ${isOnLeave ? (isOverdue ? 'badge-danger' : 'badge-warning') : 'badge-success'}`}>
                {isOnLeave ? (isOverdue ? '귀사예정 초과' : '외박 중') : '기숙사 내'}
              </span>
            </div>

            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">학번</dt>
                <dd className="font-medium">{student.hakbun}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">이름</dt>
                <dd className="font-medium">{student.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">호실</dt>
                <dd className="font-medium">{student.floor}층 {student.roomNo}호</dd>
              </div>
              {student.roomType && (
                <div>
                  <dt className="text-sm text-gray-500">방 유형</dt>
                  <dd className="font-medium">{student.roomType}</dd>
                </div>
              )}
              {student.dept && (
                <div>
                  <dt className="text-sm text-gray-500">학과</dt>
                  <dd className="font-medium">{student.dept}</dd>
                </div>
              )}
              {student.grade && (
                <div>
                  <dt className="text-sm text-gray-500">학년</dt>
                  <dd className="font-medium">{student.grade}학년</dd>
                </div>
              )}
              {student.sex && (
                <div>
                  <dt className="text-sm text-gray-500">성별</dt>
                  <dd className="font-medium">{student.sex}</dd>
                </div>
              )}
              {student.phone && (
                <div>
                  <dt className="text-sm text-gray-500">연락처</dt>
                  <dd className="font-medium">{student.phone}</dd>
                </div>
              )}
              {student.email && (
                <div>
                  <dt className="text-sm text-gray-500">이메일</dt>
                  <dd className="font-medium">{student.email}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500">보호자 연락처</dt>
                <dd className="font-medium text-primary-600">{student.guardianPhone}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* 외박 정보 & 로그 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 현재 외박 정보 */}
          {activeLeave && (
            <div className={`card border-l-4 ${isOverdue ? 'border-red-500' : 'border-yellow-500'}`}>
              <h2 className="text-lg font-semibold mb-4">현재 외박 정보</h2>
              
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">외박일시</dt>
                  <dd className="font-medium">
                    {format(new Date(activeLeave.leaveStart), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">귀사예정일시</dt>
                  <dd className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                    {format(new Date(activeLeave.expectedReturn), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm text-gray-500">사유</dt>
                  <dd className="font-medium">{activeLeave.reason}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* 최근 외박 내역 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">최근 외박 내역</h2>
            
            {recentLeaves.length === 0 ? (
              <p className="text-gray-500 text-center py-4">외박 내역이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {recentLeaves.map((leave) => {
                  // 해당 외박의 가장 최근 로그 찾기
                  const relatedLogs = logs.filter(log => log.leaveRequestId === leave.id);
                  const latestLog = relatedLogs.length > 0 
                    ? relatedLogs.reduce((latest, current) => 
                        new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest
                      )
                    : null;
                  
                  return (
                    <div
                      key={leave.id}
                      onClick={() => {
                        if (latestLog) {
                          setSelectedLogId(latestLog.id);
                          setIsModalOpen(true);
                        }
                      }}
                      className={`p-3 rounded-lg border transition-colors ${
                        leave.isDeleted ? 'bg-gray-50 opacity-50' : 'bg-white'
                      } ${latestLog ? 'cursor-pointer hover:bg-gray-50 hover:border-primary-300' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">
                          {format(new Date(leave.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                        </span>
                        <div className="flex items-center gap-2">
                          {leave.isDeleted ? (
                            <span className="badge badge-danger">삭제됨</span>
                          ) : leave.actualReturn ? (
                            <span className="badge badge-success">귀사 완료</span>
                          ) : (
                            <span className="badge badge-warning">외박 중</span>
                          )}
                          {latestLog && (
                            <span className="text-xs text-gray-400">상세보기 →</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm">
                        {format(new Date(leave.leaveStart), 'M/d HH:mm')} ~ {format(new Date(leave.expectedReturn), 'M/d HH:mm')}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{leave.reason}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 활동 로그 */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">활동 로그</h2>
            
            {logs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">활동 로그가 없습니다.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div 
                      key={log.id} 
                      className="relative pl-10 cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
                      onClick={() => {
                        setSelectedLogId(log.id);
                        setIsModalOpen(true);
                      }}
                    >
                      <div className="absolute left-2.5 w-3 h-3 bg-white border-2 border-primary-500 rounded-full"></div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${ACTION_LABELS[log.actionType].color}`}>
                          {ACTION_LABELS[log.actionType].label}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto">클릭하여 상세보기</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
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
