import { ApiPropertyOptional } from '@nestjs/swagger';
import { FIELD_MESSAGES, FIELD_PATTERNS } from '@fems/shared';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(FIELD_PATTERNS.PERSON_NAME_PART, {
    message: FIELD_MESSAGES.PERSON_NAME_PART,
  })
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(FIELD_PATTERNS.PERSON_NAME_PART, {
    message: FIELD_MESSAGES.PERSON_NAME_PART,
  })
  lastName?: string;
}
