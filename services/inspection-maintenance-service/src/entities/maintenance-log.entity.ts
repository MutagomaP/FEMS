import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('maintenance_logs')
@Index('idx_maintenance_logs_date', ['maintenanceDate'])
@Index('idx_maintenance_logs_extinguisher', ['extinguisherId'])
export class MaintenanceLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'extinguisher_id', type: 'uuid' })
  extinguisherId: string;

  @Column({ name: 'inspector_user_id', type: 'uuid' })
  inspectorUserId: string;

  @Column({ name: 'action_taken', length: 255 })
  actionTaken: string;

  @Column({ name: 'maintenance_date', type: 'date' })
  maintenanceDate: string;

  @Column({ name: 'issues_identified', type: 'text', nullable: true })
  issuesIdentified: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', nullable: true })
  recommendations: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
