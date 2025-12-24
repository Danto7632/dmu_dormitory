export interface Student {
  hakbun: string;
  name: string;
  floor: number;
  roomNo: string;
  roomType?: string;
  sex?: string;
  dept?: string;
  grade?: number;
  phone?: string;
  email?: string;
  guardianPhone: string;
  no?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: number;
  hakbun: string;
  leaveStart: string;
  expectedReturn: string;
  reason: string;
  actualReturn?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  student?: Student;
}

export type ActionType = 'APPLY' | 'EDIT' | 'DELETE' | 'RETURN';

export interface AuditLog {
  id: number;
  actorHakbun: string;
  actionType: ActionType;
  leaveRequestId?: number;
  payloadBefore?: any;
  payloadAfter?: any;
  createdAt: string;
  student?: Student;
}

export interface Admin {
  id: number;
  username: string;
  name: string;
}

export interface LoginResponse {
  access_token: string;
  student?: Student;
  admin?: Admin;
}

export interface DashboardStatus {
  inDorm: number;
  onLeave: number;
  overdue: number;
  onLeaveList: LeaveRequest[];
  inDormList: Student[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}
