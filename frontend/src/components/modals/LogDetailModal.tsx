import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { AuditLog, ActionType, Student } from '../../types';

interface LogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  logId: number | null;
}

const ACTION_LABELS: Record<ActionType, { label: string; color: string; icon: string }> = {
  APPLY: { label: '외박 신청', color: 'bg-blue-100 text-blue-800', icon: '📝' },
  EDIT: { label: '정보 수정', color: 'bg-yellow-100 text-yellow-800', icon: '✏️' },
  DELETE: { label: '신청 삭제', color: 'bg-red-100 text-red-800', icon: '🗑️' },
  RETURN: { label: '귀사 처리', color: 'bg-green-100 text-green-800', icon: '🏠' },
};

// 변경 내역을 비교하여 표시
function getChanges(before: any, after: any): { field: string; oldValue: any; newValue: any }[] {
  if (!before || !after) return [];
  
  const changes: { field: string; oldValue: any; newValue: any }[] = [];
  const fieldLabels: Record<string, string> = {
    leaveStart: '외박 시작일시',
    expectedReturn: '귀사 예정일시',
    reason: '사유',
    actualReturn: '실제 귀사일시',
  };

  for (const key of Object.keys(after)) {
    if (key === 'updatedAt' || key === 'createdAt' || key === 'id' || key === 'hakbun' || key === 'isDeleted') continue;
    
    const oldVal = before[key];
    const newVal = after[key];
    
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        field: fieldLabels[key] || key,
        oldValue: formatValue(key, oldVal),
        newValue: formatValue(key, newVal),
      });
    }
  }
  
  return changes;
}

function formatValue(key: string, value: any): string {
  if (value === null || value === undefined) return '-';
  
  if (key.includes('Start') || key.includes('Return') || key.includes('At')) {
    try {
      return format(new Date(value), 'yyyy-MM-dd HH:mm', { locale: ko });
    } catch {
      return String(value);
    }
  }
  
  return String(value);
}

export default function LogDetailModal({ isOpen, onClose, logId }: LogDetailModalProps) {
  const navigate = useNavigate();
  
  const { data, isLoading } = useQuery({
    queryKey: ['logDetail', logId],
    queryFn: async () => {
      const response = await api.get(`/audit-log/${logId}`);
      return response.data;
    },
    enabled: isOpen && logId !== null,
  });

  if (!isOpen || logId === null) return null;

  const log: AuditLog | undefined = data?.log;
  const relatedLogs: AuditLog[] = data?.relatedLogs || [];
  const student: Student | undefined = log?.student;

  const handleStudentClick = () => {
    if (student?.hakbun) {
      onClose();
      navigate(`/admin/students/${student.hakbun}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">로그 상세 정보</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-500">로딩 중...</div>
          ) : !log ? (
            <div className="text-center py-12 text-gray-500">로그를 찾을 수 없습니다.</div>
          ) : (
            <>
              {/* 학생 정보 카드 */}
              <div 
                className="bg-gray-50 rounded-lg p-4 mb-6 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={handleStudentClick}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700">👤 학생 정보</h3>
                  <span className="text-sm text-primary-600">상세보기 →</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">학번:</span>
                    <span className="ml-2 font-medium">{student?.hakbun || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">이름:</span>
                    <span className="ml-2 font-medium">{student?.name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">호실:</span>
                    <span className="ml-2 font-medium">{student?.floor}층 {student?.roomNo}호</span>
                  </div>
                  <div>
                    <span className="text-gray-500">학과:</span>
                    <span className="ml-2 font-medium">{student?.dept || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">학년:</span>
                    <span className="ml-2 font-medium">{student?.grade ? `${student.grade}학년` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">연락처:</span>
                    <span className="ml-2 font-medium">{student?.phone || '-'}</span>
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <span className="text-gray-500">보호자 연락처:</span>
                    <span className="ml-2 font-medium">{student?.guardianPhone || '-'}</span>
                  </div>
                </div>
              </div>

              {/* 현재 로그 정보 */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${ACTION_LABELS[log.actionType].color}`}>
                    {ACTION_LABELS[log.actionType].icon} {ACTION_LABELS[log.actionType].label}
                  </span>
                  <span className="text-sm text-gray-600">
                    {format(new Date(log.createdAt), 'yyyy년 M월 d일 HH:mm:ss', { locale: ko })}
                  </span>
                </div>

                {/* 수정 내역 표시 */}
                {log.actionType === 'EDIT' && log.payloadBefore && log.payloadAfter && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">📋 변경 내역</h4>
                    <div className="bg-white rounded p-3 space-y-2">
                      {getChanges(log.payloadBefore, log.payloadAfter).map((change, idx) => (
                        <div key={idx} className="flex items-center text-sm">
                          <span className="font-medium text-gray-700 w-28">{change.field}:</span>
                          <span className="text-red-600 line-through mr-2">{change.oldValue}</span>
                          <span className="text-gray-400 mr-2">→</span>
                          <span className="text-green-600 font-medium">{change.newValue}</span>
                        </div>
                      ))}
                      {getChanges(log.payloadBefore, log.payloadAfter).length === 0 && (
                        <span className="text-gray-500 text-sm">변경 내역이 없습니다.</span>
                      )}
                    </div>
                  </div>
                )}

                {/* 신청 정보 표시 */}
                {log.actionType === 'APPLY' && log.payloadAfter && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-2">📋 신청 내용</h4>
                    <div className="bg-white rounded p-3 space-y-2 text-sm">
                      <div className="flex">
                        <span className="text-gray-500 w-28">외박 시작:</span>
                        <span>{formatValue('leaveStart', log.payloadAfter.leaveStart)}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-28">귀사 예정:</span>
                        <span>{formatValue('expectedReturn', log.payloadAfter.expectedReturn)}</span>
                      </div>
                      <div className="flex">
                        <span className="text-gray-500 w-28">사유:</span>
                        <span>{log.payloadAfter.reason || '-'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 관련 활동 타임라인 */}
              {relatedLogs.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-4">📜 이 외박 신청의 전체 활동 내역</h3>
                  <div className="relative">
                    {/* 타임라인 선 */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    
                    <div className="space-y-4">
                      {relatedLogs.map((relatedLog, idx) => {
                        const isCurrentLog = relatedLog.id === log.id;
                        const actionInfo = ACTION_LABELS[relatedLog.actionType];
                        
                        return (
                          <div 
                            key={relatedLog.id} 
                            className={`relative pl-10 ${isCurrentLog ? 'opacity-100' : 'opacity-70'}`}
                          >
                            {/* 타임라인 점 */}
                            <div className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center text-xs
                              ${isCurrentLog ? 'bg-primary-500 text-white ring-4 ring-primary-100' : 'bg-gray-300 text-gray-600'}`}>
                              {idx + 1}
                            </div>
                            
                            <div className={`rounded-lg p-3 ${isCurrentLog ? 'bg-primary-50 border-2 border-primary-200' : 'bg-gray-50'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionInfo.color}`}>
                                  {actionInfo.icon} {actionInfo.label}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(relatedLog.createdAt), 'M/d HH:mm:ss', { locale: ko })}
                                </span>
                              </div>
                              
                              {/* 각 로그 타입별 요약 정보 */}
                              {relatedLog.actionType === 'EDIT' && relatedLog.payloadBefore && relatedLog.payloadAfter && (
                                <div className="text-xs text-gray-600">
                                  {getChanges(relatedLog.payloadBefore, relatedLog.payloadAfter).map((change, i) => (
                                    <span key={i}>
                                      {change.field}: <span className="text-red-500">{change.oldValue}</span> → <span className="text-green-500">{change.newValue}</span>
                                      {i < getChanges(relatedLog.payloadBefore, relatedLog.payloadAfter).length - 1 && ', '}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              {relatedLog.actionType === 'APPLY' && relatedLog.payloadAfter && (
                                <div className="text-xs text-gray-600">
                                  {formatValue('leaveStart', relatedLog.payloadAfter.leaveStart)} ~ {formatValue('expectedReturn', relatedLog.payloadAfter.expectedReturn)}
                                </div>
                              )}
                              
                              {relatedLog.actionType === 'RETURN' && relatedLog.payloadAfter && (
                                <div className="text-xs text-gray-600">
                                  실제 귀사: {formatValue('actualReturn', relatedLog.payloadAfter.actualReturn)}
                                </div>
                              )}
                              
                              {relatedLog.actionType === 'DELETE' && (
                                <div className="text-xs text-gray-600">
                                  외박 신청이 삭제되었습니다.
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 닫기 버튼 */}
          <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="btn btn-secondary">
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
