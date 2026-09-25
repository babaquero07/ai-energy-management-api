import { forwardRef, Module } from '@nestjs/common';
import { MetersService } from './meters.service';
import { MetersController } from './meters.controller';
import { Meter } from './entities/meter.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisModule } from 'src/analysis/analysis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meter]),
    forwardRef(() => AnalysisModule),
  ],
  controllers: [MetersController],
  providers: [MetersService],
  exports: [MetersService],
})
export class MetersModule {}
