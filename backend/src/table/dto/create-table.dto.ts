import { IsInt, IsString, IsOptional, Min } from 'class-validator';

export class CreateTableDto {
  @IsInt()
  @Min(1)
  number!: number;

  @IsString()
  @IsOptional()
  zone?: string;
}
