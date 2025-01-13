import {
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { Public, ResponseMessage } from '@/decorator/customize';
import {
  CodeAuthDto,
  CreateAuthDto,
  CreateNewPasswordAuthDto,
} from './dto/create-auth.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly mailerService: MailerService,
  ) {}

  @Post('login')
  @Public() // Tạo 1 cái meta data 'Public' để khi login tránh bị guard global
  @UseGuards(LocalAuthGuard)
  @ResponseMessage('Đăng nhập thành công')
  @ApiOperation({ summary: 'Handle Login' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'example@domain.com',
        },
        password: {
          type: 'string',
          example: 'Abc@1234',
        },
      },
    },
  })
  handleLogin(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('refresh-token')
  @Public()
  @ApiOperation({ summary: 'Get refresh token' })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    try {
      // Xác thực Refresh Token
      const payload = this.authService.verifyRefreshToken(refreshToken);
      // Tạo Access Token mới
      return this.authService.handleRefreshToken({
        email: payload.email,
        sub: payload.sub,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('logout')
  @Public() // Tạo 1 cái meta data 'Public' để khi login tránh bị guard global
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Handle Logout' })
  handleLogout(@Request() req) {
    return req.logout();
  }

  // @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Handle Signup' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'example@domain.com',
        },
        password: {
          type: 'string',
          example: 'Abc@1234',
        },
        name: {
          type: 'string',
          example: 'example',
        },
      },
    },
  })
  register(@Body() registerDto: CreateAuthDto) {
    return this.authService.handleRegister(registerDto);
  }

  @Post('register-fact')
  @Public()
  @ApiOperation({ summary: 'Handle Signup' })
  registerFact(@Body('count') count: number) {
    return this.authService.handleFactRegister(count);
  }

  @Post('check-code')
  @ResponseMessage('Tài khoản đã được kích hoạt')
  @Public()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: '1a2a3a4a5a6a7a8a9a10a',
        },
        code: {
          type: 'string',
          example: '1a-2a-3a-4a-5a-6a-7a-8a-9a-10a',
        },
      },
    },
  })
  checkCode(@Body() registerDto: CodeAuthDto) {
    return this.authService.checkCode(registerDto);
  }

  @Post('retry-active')
  @Public()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'example@domain.com',
        },
      },
    },
  })
  retryActive(@Body('email') email: string) {
    return this.authService.retryActive(email);
  }

  @Post('retry-password')
  @Public()
  @ApiOperation({ summary: 'Forget password' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'example@domain.com',
        },
      },
    },
  })
  retryPassword(@Body('email') email: string) {
    return this.authService.retryPassword(email);
  }

  @Post('create-new-password')
  @Public()
  @ResponseMessage('Tạo password mới thành công')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          example: '1a2a3a4a5a6a7a8a9a10a',
        },
        password: {
          type: 'string',
          example: 'Abc@1234',
        },
        confirmPassword: {
          type: 'string',
          example: 'Abc@1234',
        },
        email: {
          type: 'string',
          example: 'example@domain.com',
        },
      },
    },
  })
  createNewPassword(@Body() data: CreateNewPasswordAuthDto) {
    return this.authService.createNewPassword(data);
  }

  @Get('mail')
  @Public()
  testMail(@Request() req): string {
    const mailOptions = {
      to: 'hungsibo571999@gmail.com', // list of receivers
      subject: 'Testing Nest MailerModule ✔', // Subject line
      text: 'welcome', // plaintext body
      html: '<b> Hello world with Hùng Nguyễn </b>',
      template: 'register',
      context: {
        name: req.user.name,
        activationCode: req.user.codeId,
      },
    };
    this.mailerService.sendMail(mailOptions);
    return 'ok';
  }
}
