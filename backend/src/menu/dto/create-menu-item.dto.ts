import { IsString, IsNumber, IsPositive, IsOptional, MinLength } from 'class-validator';

export class CreateMenuItemDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsString()
  @MinLength(2)
  category: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
