import { ApiProperty } from '@nestjs/swagger';
import { FIELD_MESSAGES, FIELD_PATTERNS } from '@fems/shared';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AssignExtinguisherDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 'Building A — Floor 2 — East corridor' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  @Matches(FIELD_PATTERNS.LOCATION, {
    message: FIELD_MESSAGES.LOCATION,
  })
  location: string;
}
