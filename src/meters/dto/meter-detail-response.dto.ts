import { CurrentReadingDto } from './current-reading.dto';
import { MeterAnalysisDto } from './meter-analysis.dto';
import { MeterResponseDto } from './meter-response.dto';
import { ReadingResponseDto } from '../../readings/dto/reading-response.dto';

export class MeterDetailResponseDto extends MeterResponseDto {
  current: CurrentReadingDto;
  analysis: MeterAnalysisDto;
  history: ReadingResponseDto[];
}
