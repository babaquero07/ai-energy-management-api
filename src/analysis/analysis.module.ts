import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { Analysis } from './entities/analysis.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaselineService } from './baseline.service';

@Module({
  imports: [TypeOrmModule.forFeature([Analysis])],
  controllers: [AnalysisController],
  providers: [AnalysisService, BaselineService],
  exports: [BaselineService],
})
export class AnalysisModule { }
