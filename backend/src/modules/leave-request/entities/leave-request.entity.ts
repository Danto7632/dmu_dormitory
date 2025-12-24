import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from '../../student/entities/student.entity';

@Entity('leave_requests')
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  hakbun: string;

  @Column({ name: 'leave_start', type: 'datetime' })
  leaveStart: Date;

  @Column({ name: 'expected_return', type: 'datetime' })
  expectedReturn: Date;

  @Column({ type: 'text' })
  reason: string;

  @Column({ name: 'actual_return', type: 'datetime', nullable: true })
  actualReturn: Date;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Student, (student) => student.leaveRequests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hakbun', referencedColumnName: 'hakbun' })
  student: Student;
}
