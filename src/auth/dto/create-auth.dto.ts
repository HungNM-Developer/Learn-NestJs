import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAuthDto {
  @IsNotEmpty({ message: 'email không được để trống' })
  email: string;

  @IsNotEmpty({ message: 'password không được để trống' })
  password: string;

  @IsOptional()
  name: string;
}

export class CodeAuthDto {
  @IsNotEmpty({ message: 'id không được để trống' })
  id: string;

  @IsNotEmpty({ message: 'code không được để trống' })
  code: string;
}

export class CreateNewPasswordAuthDto {
  @IsNotEmpty({ message: 'code không được để trống' })
  code: string;

  @IsNotEmpty({ message: 'password không được để trống' })
  password: string;

  @IsNotEmpty({ message: 'confirmPassword không được để trống' })
  confirmPassword: string;

  @IsNotEmpty({ message: 'email không được để trống' })
  email: string;
}

export class ChangePasswordAuthDto {
  @IsNotEmpty({ message: 'email không được để trống' })
  email: string;

  @IsNotEmpty({ message: 'password không được để trống' })
  oldPassword: string;

  @IsNotEmpty({ message: 'password không được để trống' })
  newPassword: string;

  @IsNotEmpty({ message: 'confirmPassword không được để trống' })
  confirmPassword: string;
}
