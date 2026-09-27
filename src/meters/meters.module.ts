import { Module } from '@nestjs/common';
import { MetersService } from './meters.service';
import { MetersController } from './meters.controller';
import { Meter } from './entities/meter.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaselineModule } from 'src/analysis/baseline.module';

@Module({
  imports: [TypeOrmModule.forFeature([Meter]), BaselineModule],
  controllers: [MetersController],
  providers: [MetersService],
  exports: [MetersService],
})
export class MetersModule {}
