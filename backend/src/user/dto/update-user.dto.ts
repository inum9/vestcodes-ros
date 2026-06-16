import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(['manager', 'kitchen', 'floor'])
  role?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
