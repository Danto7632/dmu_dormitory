import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Student } from '../../student/entities/student.entity';

export enum ActionType {
  APPLY = 'APPLY',
  EDIT = 'EDIT',
  DELETE = 'DELETE',
  RETURN = 'RETURN',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'actor_hakbun', length: 20 })
  actorHakbun: string;

  @Column({
    name: 'action_type',
    type: 'enum',
    enum: ActionType,
  })
  actionType: ActionType;

  @Column({ name: 'leave_request_id', type: 'int', nullable: true })
  leaveRequestId: number;

  @Column({ name: 'payload_before', type: 'json', nullable: true })
  payloadBefore: any;

  @Column({ name: 'payload_after', type: 'json', nullable: true })
  payloadAfter: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Student, (student) => student.auditLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actor_hakbun', referencedColumnName: 'hakbun' })
  student: Student;
}
