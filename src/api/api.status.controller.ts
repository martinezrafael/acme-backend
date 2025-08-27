import { Controller, Get, HttpStatus, Param } from '@nestjs/common';
import { StatusService } from '../notifications/status.service';
import { IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

class StatusParamDto {
  @IsUUID()
  @Transform(({ value }) => String(value))
  mensagemId!: string;
}

@Controller('api/status')
export class ApiStatusController {
  constructor(private readonly status: StatusService) {}

  @Get(':mensagemId')
  getStatus(@Param() params: StatusParamDto) {
    const s = this.status.getStatus(params.mensagemId);
    if (!s) {
      return {
        statusCode: HttpStatus.ACCEPTED,
        status: 'PENDENTE',
        mensagemId: params.mensagemId,
      };
    }
    return {
      statusCode: HttpStatus.OK,
      mensagemId: params.mensagemId,
      status: s,
    };
  }
}
