import { ApiProperty } from '@nestjs/swagger';
import { UserRole, FIELD_MESSAGES, FIELD_PATTERNS } from '@fems/shared';
import {
  IsEmail,
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(FIELD_PATTERNS.PERSON_NAME_PART, {
    message: FIELD_MESSAGES.PERSON_NAME_PART,
  })
  firstName: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(FIELD_PATTERNS.PERSON_NAME_PART, {
    message: FIELD_MESSAGES.PERSON_NAME_PART,
  })
  lastName: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(FIELD_PATTERNS.PASSWORD, {
    message: FIELD_MESSAGES.PASSWORD,
  })
  password: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}
