import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsIn(['manager', 'kitchen', 'floor'])
  role!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
