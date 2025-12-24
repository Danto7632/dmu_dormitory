import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { LeaveRequest } from '../../leave-request/entities/leave-request.entity';
import { AuditLog } from '../../audit-log/entities/audit-log.entity';

@Entity('students')
export class Student {
  @PrimaryColumn({ length: 20 })
  hakbun: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 50 })
  name: string;

  @Column({ type: 'int' })
  floor: number;

  @Column({ name: 'room_no', length: 10 })
  roomNo: string;

  @Column({ name: 'room_type', length: 50, nullable: true })
  roomType: string;

  @Column({ length: 10, nullable: true })
  sex: string;

  @Column({ length: 100, nullable: true })
  dept: string;

  @Column({ type: 'int', nullable: true })
  grade: number;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ name: 'guardian_phone', length: 20 })
  guardianPhone: string;

  @Column({ type: 'int', nullable: true })
  no: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => LeaveRequest, (leaveRequest) => leaveRequest.student, { cascade: true, onDelete: 'CASCADE' })
  leaveRequests: LeaveRequest[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.student, { cascade: true, onDelete: 'CASCADE' })
  auditLogs: AuditLog[];
}
