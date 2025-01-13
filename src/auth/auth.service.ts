/* eslint-disable @typescript-eslint/no-unused-vars */
import { UsersService } from '@/modules/users/users.service';
import { comparePasswordHelper } from '@/utils/functionHelpers';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ChangePasswordAuthDto,
  CodeAuthDto,
  CreateAuthDto,
  CreateNewPasswordAuthDto,
} from './dto/create-auth.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // Tạo Access Token
  generateAccessToken(payload: any): string {
    return this.jwtService.sign(payload);
  }

  // Tạo Refresh Token
  generateRefreshToken(payload: any): string {
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
    }); // Refresh Token sống 7 ngày
  }

  verifyRefreshToken(refreshToken: string): any {
    try {
      return this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  validateUser = async (email: string, pass: string) => {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException(
        'Tài khoản không tồn tại, vui lòng đăng ký tài khoản.',
      );
    }

    const isValidPassword = await comparePasswordHelper(pass, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Mật khẩu không đúng.');
    }
    return user;
  };

  login = async (user: any) => {
    const payload = { email: user.email, sub: user.id };
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  };

  handleRefreshToken = async (payload: any) => {
    return {
      accessToken: this.generateAccessToken(payload),
    };
  };

  handleFactRegister = async (count: number) => {
    return await this.usersService.handleFactRegister(count);
  };

  handleRegister = async (registerDto: CreateAuthDto) => {
    return await this.usersService.handleRegister(registerDto);
  };

  checkCode = async (data: CodeAuthDto) => {
    return await this.usersService.handleActive(data);
  };

  retryActive = async (data: string) => {
    return await this.usersService.retryActive(data);
  };

  retryPassword = async (data: string) => {
    return await this.usersService.retryPassword(data);
  };

  createNewPassword = async (data: CreateNewPasswordAuthDto) => {
    return await this.usersService.createNewPassword(data);
  };
}
