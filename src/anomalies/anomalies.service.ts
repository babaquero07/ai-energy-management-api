import { Injectable } from '@nestjs/common';
import { CreateAnomalyDto } from './dto/create-anomaly.dto';
import { UpdateAnomalyDto } from './dto/update-anomaly.dto';

@Injectable()
export class AnomaliesService {
  create(createAnomalyDto: CreateAnomalyDto) {
    return 'This action adds a new anomaly';
  }

  findAll() {
    return `This action returns all anomalies`;
  }

  findOne(id: number) {
    return `This action returns a #${id} anomaly`;
  }

  update(id: number, updateAnomalyDto: UpdateAnomalyDto) {
    return `This action updates a #${id} anomaly`;
  }

  remove(id: number) {
    return `This action removes a #${id} anomaly`;
  }
}
