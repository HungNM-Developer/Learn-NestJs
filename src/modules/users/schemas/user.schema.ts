import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop()
  @ApiProperty({
    example: 'dfd08fd90f8df90sf',
    description: 'id of user',
  })
  id: string;

  @Prop()
  @ApiProperty({
    example: 'Hùng Nguyễn',
    description: 'name of user',
  })
  name: string;

  @Prop({ unique: true })
  @ApiProperty({
    example: 'hungnguyen@gmail.com',
    description: 'email of user',
  })
  email: string;

  @Prop()
  @ApiProperty({
    example: 'dfd08fd90f8df90sf',
    description: 'password of user',
  })
  password: string;

  @Prop()
  @ApiProperty({
    example: '09091234567',
    description: 'phone of user',
  })
  phone: string;

  @Prop()
  @ApiProperty({
    example: '142 Đường số 2',
    description: 'address of user',
  })
  address: string;

  @Prop()
  @ApiProperty({
    example: 'image.png',
    description: 'image  of user',
  })
  image: string;

  @Prop({ default: 'USER' })
  @ApiProperty({
    example: 'USER',
    description: 'role of user',
  })
  role: string;

  @Prop({ default: 'LOCAL' })
  @ApiProperty({
    example: 'LOCAL',
    description: 'accountType of user',
  })
  accountType: string;

  @Prop({ default: false })
  @ApiProperty({
    example: false,
    description: 'isActive of user',
  })
  isActive: boolean;

  @Prop()
  @ApiProperty({
    example: 'f79a87fdf7d8f7d8fd9dbu9',
    description: 'codeId of user',
  })
  codeId: string;

  @Prop()
  @ApiProperty({
    example: Date.now(),
    description: 'codeExpired of user',
  })
  codeExpired: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.method('toJSON', function () {
  const { _id, ...object } = this.toObject();
  return { id: _id, ...object };
});
