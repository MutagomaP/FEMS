import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FIELD_MESSAGES, FIELD_PATTERNS } from '@fems/shared';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  @Matches(FIELD_PATTERNS.FULL_NAME, {
    message: FIELD_MESSAGES.FULL_NAME,
  })
  fullName: string;

  @ApiProperty({ example: 'NAT-123456789' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(FIELD_PATTERNS.NATIONAL_ID, {
    message: FIELD_MESSAGES.NATIONAL_ID,
  })
  nationalId: string;

  @ApiProperty({ example: '+250788123456' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(FIELD_PATTERNS.PHONE, {
    message: FIELD_MESSAGES.PHONE,
  })
  phone: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: '123 Main Street, Kigali' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  @Matches(FIELD_PATTERNS.ADDRESS, {
    message: FIELD_MESSAGES.ADDRESS,
  })
  address: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  @Matches(FIELD_PATTERNS.FULL_NAME, {
    message: FIELD_MESSAGES.FULL_NAME,
  })
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(FIELD_PATTERNS.NATIONAL_ID, {
    message: FIELD_MESSAGES.NATIONAL_ID,
  })
  nationalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(FIELD_PATTERNS.PHONE, {
    message: FIELD_MESSAGES.PHONE,
  })
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  @Matches(FIELD_PATTERNS.ADDRESS, {
    message: FIELD_MESSAGES.ADDRESS,
  })
  address?: string;
}
