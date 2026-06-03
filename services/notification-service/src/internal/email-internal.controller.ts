import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ServiceAuthGuard } from '@fems/shared';
import { EmailService } from '../email/email.service';

class SendTransactionalEmailDto {
  @ApiProperty()
  @IsEmail()
  to: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  text: string;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(10000)
  html?: string;
}

@ApiTags('internal')
@Controller('internal/email')
@UseGuards(ServiceAuthGuard)
export class EmailInternalController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send')
  send(@Body() dto: SendTransactionalEmailDto) {
    return this.emailService.send({
      to: dto.to,
      subject: dto.subject,
      text: dto.text,
      html: dto.html,
    });
  }
}
