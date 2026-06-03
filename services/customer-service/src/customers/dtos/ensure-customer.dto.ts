import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FIELD_MESSAGES, FIELD_PATTERNS } from '@fems/shared';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class EnsureCustomerDto {
  @ApiProperty({ example: 'sita@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional({ example: 'Sita Kumar' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  @Matches(FIELD_PATTERNS.FULL_NAME, {
    message: FIELD_MESSAGES.FULL_NAME,
  })
  fullName?: string;
}
