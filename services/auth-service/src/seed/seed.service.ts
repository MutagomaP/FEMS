import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@fems/shared';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.backfillLegacyUsers();
    await this.ensureUser({
      email: 'admin@fems.local',
      firstName: 'System',
      lastName: 'Administrator',
      password: 'Admin@123',
      role: UserRole.ADMIN,
    });
    await this.ensureUser({
      email: 'inspector@fems.local',
      firstName: 'Ian',
      lastName: 'Inspector',
      password: 'Inspector@123',
      role: UserRole.INSPECTOR,
    });
  }

  private async backfillLegacyUsers() {
    const users = await this.usersRepo.find();
    for (const user of users) {
      if (!user.firstName?.trim() || !user.lastName?.trim()) {
        const parts = user.fullName.trim().split(/\s+/);
        user.firstName = parts[0] ?? 'User';
        user.lastName = parts.slice(1).join(' ') || parts[0] || 'Account';
        user.fullName = UsersService.buildFullName(user.firstName, user.lastName);
        await this.usersRepo.save(user);
      }
    }
  }

  private async ensureUser(opts: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: UserRole;
  }) {
    const existing = await this.usersRepo.findOne({
      where: { email: opts.email },
    });
    if (existing) return;

    const password = await bcrypt.hash(opts.password, 12);
    await this.usersRepo.save(
      this.usersRepo.create({
        firstName: opts.firstName,
        lastName: opts.lastName,
        fullName: UsersService.buildFullName(opts.firstName, opts.lastName),
        email: opts.email,
        password,
        role: opts.role,
      }),
    );
    this.logger.log(`Default user created: ${opts.email} / ${opts.password}`);
  }
}
