import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthResponseDto } from '@fems/shared';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

/** Checklist alias: POST /api/users/register */
@ApiTags('users')
@Controller('users')
export class UsersRegisterController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Register a new customer account (alias of POST /auth/register)' })
  @ApiCreatedResponse({ type: AuthResponseDto })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
