import { Injectable } from '@nestjs/common';
import { MetersResponseDto } from './dto/meters-response.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Meter } from './entities/meter.entity';

@Injectable()
export class MetersService {
  constructor(
    @InjectRepository(Meter)
    private meterRepository: Repository<Meter>,
  ) {}

  async findAll(): Promise<MetersResponseDto> {
    const meters = await this.meterRepository.find();

    return {
      data: meters,
      total: meters.length,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} meter`;
  }
}
