import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import {
  BadRequestException,
  //BadRequestException,
  Injectable,
  UnauthorizedException,
  //UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Thay đổi từ mặc định "username" thành "email"
      passwordField: 'password', // Mặc định là "password"
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('email/password không hợp lệ');
    }
    if (user.isActive === false) {
      throw new BadRequestException('Tài khoản chưa được kích hoạt');
    }
    return user;
  }
}
