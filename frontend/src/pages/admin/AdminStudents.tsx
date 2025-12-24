import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import AdminLayout from '../../components/layout/AdminLayout';
import StudentFormModal from '../../components/modals/StudentFormModal';
import { Student, PaginatedResponse } from '../../types';

export default function AdminStudents() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [floorFilter, setFloorFilter] = useState<number | ''>('');
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    failed: number;
    errors: { row: number; error: string }[];
  } | null>(null);

  // 학생 추가/수정 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<Student> & { page: number; limit: number }>({
    queryKey: ['adminStudents', page, searchQuery, floorFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (searchQuery) params.append('search', searchQuery);
      if (floorFilter) params.append('floor', floorFilter.toString());
      
      const response = await api.get(`/admin/students?${params.toString()}`);
      return response.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/upload/students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (result) => {
      setUploadResult(result);
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
      if (result.failed === 0) {
        toast.success(`${result.success}명의 학생 정보가 업로드되었습니다.`);
      } else {
        toast.error(`성공: ${result.success}건, 실패: ${result.failed}건`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '업로드에 실패했습니다.');
    },
  });

  // 학생 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: async (hakbun: string) => {
      await api.delete(`/admin/students/${hakbun}`);
    },
    onSuccess: () => {
      toast.success('학생이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '삭제에 실패했습니다.');
    },
  });

  // 학생 추가 버튼 클릭
  const handleAddStudent = () => {
    setSelectedStudent(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  // 학생 수정 버튼 클릭
  const handleEditStudent = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation(); // 행 클릭 이벤트 방지
    setSelectedStudent(student);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // 학생 삭제 버튼 클릭
  const handleDeleteStudent = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation(); // 행 클릭 이벤트 방지
    if (window.confirm(`${student.name}(${student.hakbun}) 학생을 삭제하시겠습니까?`)) {
      deleteMutation.mutate(student.hakbun);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/upload/template', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('템플릿 다운로드에 실패했습니다.');
    }
  };

  const totalPages = Math.ceil((data?.total || 0) / 20);

  return (
    <AdminLayout>
      {/* 업로드 섹션 */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">학생 정보 업로드</h2>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="btn btn-secondary"
          >
            📥 템플릿 다운로드
          </button>
          
          <label className="btn btn-primary cursor-pointer">
            📤 엑셀 업로드
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          
          {uploadMutation.isPending && (
            <span className="text-gray-500 flex items-center">업로드 중...</span>
          )}
        </div>

        {uploadResult && (
          <div className={`mt-4 p-4 rounded-lg ${uploadResult.failed > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
            <p className="font-medium">
              업로드 결과: 성공 {uploadResult.success}건, 실패 {uploadResult.failed}건
            </p>
            {uploadResult.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">오류 목록:</p>
                <ul className="text-sm text-red-600 max-h-40 overflow-y-auto">
                  {uploadResult.errors.map((err, idx) => (
                    <li key={idx}>행 {err.row}: {err.error}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={() => setUploadResult(null)}
              className="mt-2 text-sm text-gray-500 hover:text-gray-700"
            >
              닫기
            </button>
          </div>
        )}
      </div>

      {/* 검색 & 필터 */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="학번/이름/호실 검색"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="input flex-1"
          />
          <select
            value={floorFilter}
            onChange={(e) => {
              setFloorFilter(e.target.value ? Number(e.target.value) : '');
              setPage(1);
            }}
            className="input w-full sm:w-40"
          >
            <option value="">전체 층</option>
            {[2, 3, 4, 5, 6, 7, 8, 9].map((floor) => (
              <option key={floor} value={floor}>{floor}층</option>
            ))}
          </select>
        </div>
      </div>

      {/* 학생 목록 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            학생 목록 <span className="text-gray-500 text-sm font-normal">({data?.total || 0}명)</span>
          </h2>
          <button
            onClick={handleAddStudent}
            className="btn btn-primary"
          >
            ➕ 학생 추가
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            등록된 학생이 없습니다. 엑셀 파일을 업로드하거나 학생을 추가해주세요.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">학번</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">이름</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">층</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">호실</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">학과</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">연락처</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.map((student) => (
                    <tr
                      key={student.hakbun}
                      onClick={() => navigate(`/admin/students/${student.hakbun}`)}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="py-3 px-4">{student.hakbun}</td>
                      <td className="py-3 px-4 font-medium">{student.name}</td>
                      <td className="py-3 px-4">{student.floor}층</td>
                      <td className="py-3 px-4">{student.roomNo}호</td>
                      <td className="py-3 px-4">{student.dept || '-'}</td>
                      <td className="py-3 px-4">{student.phone || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={(e) => handleEditStudent(e, student)}
                            className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50"
                          >
                            수정
                          </button>
                          <button
                            onClick={(e) => handleDeleteStudent(e, student)}
                            className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
                            disabled={deleteMutation.isPending}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
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

      {/* 학생 추가/수정 모달 */}
      <StudentFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        mode={modalMode}
      />
    </AdminLayout>
  );
}
