import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
} from 'class-validator';

export class UpdateUserDto {
  @IsMongoId({ message: '_id không hợp lệ' })
  @IsNotEmpty({ message: '_id không được để trống' })
  id: string;

  @IsOptional()
  name: string;

  @IsOptional()
  @IsPhoneNumber()
  phone: string;

  @IsOptional()
  address: string;

  @IsOptional()
  image: string;
}
