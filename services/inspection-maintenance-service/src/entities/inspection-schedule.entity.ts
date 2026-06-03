import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InspectionStatus } from '../enums/inspection-status.enum';

@Entity('inspection_schedules')
@Index('idx_inspection_schedules_date', ['inspectionDate'])
@Index('idx_inspection_schedules_extinguisher', ['extinguisherId'])
export class InspectionSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'extinguisher_id', type: 'uuid' })
  extinguisherId: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ name: 'scheduled_by_user_id', type: 'uuid' })
  scheduledByUserId: string;

  @Column({ name: 'inspector_user_id', type: 'uuid', nullable: true })
  inspectorUserId: string | null;

  @Column({ name: 'inspection_date', type: 'date' })
  inspectionDate: string;

  @Column({ name: 'inspection_time', length: 5 })
  inspectionTime: string;

  @Column({
    type: 'enum',
    enum: InspectionStatus,
    default: InspectionStatus.PENDING,
  })
  status: InspectionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
