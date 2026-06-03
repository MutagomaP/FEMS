import { ApiProperty } from '@nestjs/swagger';
import { FIELD_MESSAGES, FIELD_PATTERNS } from '@fems/shared';
import {
  IsEmail,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: '482913', description: '6-digit code from email' })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'OTP must be exactly 6 digits' })
  otp: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(FIELD_PATTERNS.PASSWORD, {
    message: FIELD_MESSAGES.PASSWORD,
  })
  newPassword: string;
}
