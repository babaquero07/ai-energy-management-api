import { ReadingResponseDto } from '../../readings/dto/reading-response.dto';

export class ReadingsResponseDto {
  data: ReadingResponseDto[];
  total: number;
}
