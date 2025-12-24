import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { Student } from '../../types';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  mode: 'create' | 'edit';
}

interface StudentFormData {
  hakbun: string;
  name: string;
  floor: number;
  roomNo: string;
  guardianPhone: string;
  roomType?: string;
  sex?: string;
  dept?: string;
  grade?: number;
  phone?: string;
  email?: string;
}

export default function StudentFormModal({
  isOpen,
  onClose,
  student,
  mode,
}: StudentFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<StudentFormData>({
    hakbun: '',
    name: '',
    floor: 2,
    roomNo: '',
    guardianPhone: '',
    roomType: '',
    sex: '',
    dept: '',
    grade: undefined,
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (student && mode === 'edit') {
      setFormData({
        hakbun: student.hakbun,
        name: student.name,
        floor: student.floor,
        roomNo: student.roomNo,
        guardianPhone: student.guardianPhone,
        roomType: student.roomType || '',
        sex: student.sex || '',
        dept: student.dept || '',
        grade: student.grade || undefined,
        phone: student.phone || '',
        email: student.email || '',
      });
    } else {
      setFormData({
        hakbun: '',
        name: '',
        floor: 2,
        roomNo: '',
        guardianPhone: '',
        roomType: '',
        sex: '',
        dept: '',
        grade: undefined,
        phone: '',
        email: '',
      });
    }
  }, [student, mode, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: StudentFormData) => api.post('/admin/students', data),
    onSuccess: () => {
      toast.success('학생이 추가되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '학생 추가에 실패했습니다.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ hakbun, ...data }: StudentFormData) =>
      api.put(`/admin/students/${hakbun}`, data),
    onSuccess: () => {
      toast.success('학생 정보가 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student'] });
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '학생 수정에 실패했습니다.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hakbun || !formData.name || !formData.roomNo || !formData.guardianPhone) {
      toast.error('필수 항목을 입력해주세요.');
      return;
    }

    // grade가 빈값이면 undefined로 처리
    const submitData = {
      ...formData,
      grade: formData.grade || undefined,
    };

    if (mode === 'create') {
      createMutation.mutate(submitData);
    } else {
      updateMutation.mutate(submitData);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'floor' || name === 'grade' ? (value ? Number(value) : undefined) : value,
    }));
  };

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {mode === 'create' ? '학생 추가' : '학생 정보 수정'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학번 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="hakbun"
                  value={formData.hakbun}
                  onChange={handleChange}
                  disabled={mode === 'edit'}
                  className="input disabled:bg-gray-100"
                  placeholder="20231234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input"
                  placeholder="홍길동"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  층 <span className="text-red-500">*</span>
                </label>
                <select
                  name="floor"
                  value={formData.floor}
                  onChange={handleChange}
                  className="input"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9].map((f) => (
                    <option key={f} value={f}>
                      {f}층
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  호실 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="roomNo"
                  value={formData.roomNo}
                  onChange={handleChange}
                  className="input"
                  placeholder="401"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                보호자 연락처 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="guardianPhone"
                value={formData.guardianPhone}
                onChange={handleChange}
                className="input"
                placeholder="010-1234-5678"
              />
            </div>

            <hr className="my-4" />
            <p className="text-sm text-gray-500">선택 항목</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  방 타입
                </label>
                <input
                  type="text"
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleChange}
                  className="input"
                  placeholder="2인실"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  성별
                </label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">선택</option>
                  <option value="남">남</option>
                  <option value="여">여</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학과
                </label>
                <input
                  type="text"
                  name="dept"
                  value={formData.dept}
                  onChange={handleChange}
                  className="input"
                  placeholder="컴퓨터공학과"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학년
                </label>
                <select
                  name="grade"
                  value={formData.grade || ''}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">선택</option>
                  <option value="1">1학년</option>
                  <option value="2">2학년</option>
                  <option value="3">3학년</option>
                  <option value="4">4학년</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input"
                  placeholder="010-5678-1234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="student@example.com"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                취소
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? '처리 중...' : mode === 'create' ? '추가' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
