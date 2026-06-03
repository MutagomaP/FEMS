import { ApiProperty } from '@nestjs/swagger';
import { FIELD_MESSAGES, FIELD_PATTERNS } from '@fems/shared';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(FIELD_PATTERNS.PERSON_NAME_PART, {
    message: FIELD_MESSAGES.PERSON_NAME_PART,
  })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(FIELD_PATTERNS.PERSON_NAME_PART, {
    message: FIELD_MESSAGES.PERSON_NAME_PART,
  })
  lastName: string;

  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(FIELD_PATTERNS.PASSWORD, {
    message: FIELD_MESSAGES.PASSWORD,
  })
  password: string;
}
