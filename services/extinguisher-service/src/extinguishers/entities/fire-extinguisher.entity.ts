import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExtinguisherSize } from './extinguisher-size.enum';
import { ExtinguisherStatus } from './extinguisher-status.enum';
import { ExtinguisherType } from './extinguisher-type.enum';

@Entity('fire_extinguishers')
@Index('idx_fire_extinguishers_expiry_date', ['expiryDate'])
@Index('idx_fire_extinguishers_customer_id', ['customerId'])
export class FireExtinguisher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'serial_number', length: 100, unique: true })
  serialNumber: string;

  @Column({ length: 255 })
  location: string;

  @Column({ type: 'enum', enum: ExtinguisherType })
  type: ExtinguisherType;

  @Column({ type: 'enum', enum: ExtinguisherSize })
  size: ExtinguisherSize;

  @Column({ name: 'installation_date', type: 'date' })
  installationDate: string;

  @Column({ name: 'expiry_date', type: 'date' })
  expiryDate: string;

  @Column({
    type: 'enum',
    enum: ExtinguisherStatus,
    default: ExtinguisherStatus.ACTIVE,
  })
  status: ExtinguisherStatus;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
