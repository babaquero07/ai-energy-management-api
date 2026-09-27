import { Module } from '@nestjs/common';
import { BaselineService } from './baseline.service';

@Module({
  providers: [BaselineService],
  exports: [BaselineService],
})
export class BaselineModule {}
