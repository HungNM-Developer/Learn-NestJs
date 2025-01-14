/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { hashPasswordHelper } from '@/utils/functionHelpers';
import aqp from 'api-query-params';
import {
  ChangePasswordAuthDto,
  CodeAuthDto,
  CreateAuthDto,
  CreateNewPasswordAuthDto,
} from '@/auth/dto/create-auth.dto';
import dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';
import { v4 as uuidv4 } from 'uuid';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { ResponseDto } from '@/core/response-dto';
import { catchError, throwError } from 'rxjs';
import { faker } from '@faker-js/faker';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private readonly mailerService: MailerService,

    @InjectQueue('userQueue')
    private readonly userQueue: Queue,
  ) {}

  isEmailExist = async (email: string) => {
    const user = await this.userModel.exists({ email });
    if (user) return true;
    return false;
  };

  async create(createUserDto: CreateUserDto) {
    const { name, email, password, phone, address, image } = createUserDto;

    //check email
    const isExist = await this.isEmailExist(email);
    if (isExist === true) {
      throw new BadRequestException(
        'Email đã tồn tại: ${email}. Vui lòng sử dụng email khác.',
      );
    }

    //hash password
    const hashPassword = await hashPasswordHelper(password);
    const user = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      phone,
      address,
      image,
    });
    return {
      id: user._id,
    };
  }

  async findAll(query: string, pageNumber: number, pageSize: number) {
    const { filter, sort } = aqp(query);
    if (filter.pageNumber) delete filter.pageNumber;
    if (filter.pageSize) delete filter.pageSize;

    if (!pageNumber) pageNumber = 1;
    if (!pageSize || pageSize <= 0) pageSize = 10;

    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const skip = (pageNumber - 1) * pageSize;
    const items = await this.userModel
      .find(filter)
      .limit(pageSize)
      .skip(skip)
      .select('-password') // trả về user bỏ đi field password
      .sort({ createdAt: -1 })
      .exec();

    return {
      items, //kết quả query
      pageNumber: pageNumber, //trang hiện tại
      pageSize: pageSize, //số lượng bản ghi đã lấy
      totalPages: totalPages, //tổng số trang với điều kiện query
      totalItems: totalItems, // tổng số phần tử (số bản ghi)
      hasNext: pageNumber < totalPages,
      nextPage: pageNumber == totalPages ? null : pageNumber + 1,
      hasPrevious: true,
      previousPage: pageNumber - 1 <= 0 ? 0 : pageNumber - 1,
    };
  }

  async findOneById(id: string) {
    const result = await this.userModel.findById(id).select('-password');
    return result;
  }

  async findByEmail(email: string) {
    const result = await this.userModel.findOne({ email }).exec();
    return result;
  }

  async update(updateUserDto: UpdateUserDto) {
    try {
      const result = await this.userModel
        .findOneAndUpdate(
          { id: updateUserDto.id },
          { $set: updateUserDto },
          { new: true },
        )
        .select('-password')
        .exec();
      if (!result) {
        throw new NotFoundException('User not found');
      }
      return result;
    } catch (e) {
      throw new Error('Failed to update user: ${e.message}');
    }
  }

  async remove(id: string) {
    try {
      const result = await this.userModel
        .findByIdAndDelete(id)
        .select('-password')
        .exec();
      if (!result) {
        throw new NotFoundException('User not found');
      }
      return result;
    } catch (e) {
      return {
        message: 'User not found',
      };
      // throw new Error('Failed to update user: ${e.message}');
    }
  }

  async handleFactRegister(count: number) {
    const batchSize = 10000; // Số user xử lý mỗi lần (tối ưu performance)
    const batches = [];

    //for (let i = 0; i < count; i += batchSize) {
    const password = `123456`;
    const codeId = uuidv4();
    const hashedPassword = await hashPasswordHelper(password);
    const batch = Array.from({ length: count }, () => ({
      name: faker.internet.displayName(),
      email: `${uuidv4()}@gmail.com`,
      password: hashedPassword,
      isActive: false,
      codeId: codeId,
      codeExpired: dayjs().add(5, 'minutes'),
    }));

    batches.push(this.userModel.insertMany(batch));
    // }

    // Chờ tất cả các batch hoàn thành
    await Promise.all(batches);
  }

  async handleRegister(registerDto: CreateAuthDto) {
    const { name, email, password } = registerDto;

    //check email
    const isExist = await this.isEmailExist(email);
    if (isExist) {
      throw new BadRequestException(
        `Email đã tồn tại: ${email}. Vui lòng sử dụng email khác.`,
      );
    }

    //hash password
    const hashPassword = await hashPasswordHelper(password);
    const codeId = uuidv4();
    const user = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      isActive: false,
      codeId: codeId,
      codeExpired: dayjs().add(5, 'minutes'),
      // codeExpired: dayjs().add(30, 'seconds')
    });

    //send email
    this.mailerService.sendMail({
      to: user.email, // list of receivers
      subject: 'Activate your account at ' + user.email, // Subject line
      template: 'register',
      context: {
        name: user?.name ?? user.email,
        activationCode: codeId,
      },
    });
    //trả ra phản hồi
    return {
      id: user._id,
    };
  }

  async handleActive(data: CodeAuthDto) {
    const user = await this.userModel.findOne({
      _id: data.id,
      codeId: data.code,
    });
    if (!user) {
      throw new BadRequestException('Mã code không hợp lệ hoặc đã hết hạn');
    }

    //check expire code
    const isBeforeCheck = dayjs().isBefore(user.codeExpired);

    if (isBeforeCheck) {
      //valid => update user
      await this.userModel.updateOne({ _id: data.id }, { isActive: true });
      return { isActive: true };
    } else {
      throw new BadRequestException('Mã code đã hết hạn');
    }
  }

  async retryActive(email: string) {
    //check email
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }
    if (user.isActive) {
      throw new BadRequestException('Tài khoản đã được kích hoạt');
    }

    //send Email
    const codeId = uuidv4();

    //update user
    await user.updateOne({
      codeId: codeId,
      codeExpired: dayjs().add(5, 'minutes'),
    });

    //send email
    this.mailerService.sendMail({
      to: user.email, // list of receivers
      subject: 'Activate your account at ' + email, // Subject line
      template: 'register',
      context: {
        name: user?.name ?? user.email,
        activationCode: codeId,
      },
    });
    return { id: user.id };
  }

  async retryPassword(email: string) {
    //check email
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }

    //send Email
    const codeId = uuidv4();

    //update user
    await user.updateOne({
      codeId: codeId,
      codeExpired: dayjs().add(5, 'minutes'),
    });

    //send email
    this.mailerService.sendMail({
      to: user.email, // list of receivers
      subject: 'Change your password account at ' + email, // Subject line
      template: 'register',
      context: {
        name: user?.name ?? user.email,
        activationCode: codeId,
      },
    });
    return { id: user.id, email: user.email };
  }

  async createNewPassword(data: CreateNewPasswordAuthDto) {
    if (data.confirmPassword !== data.password) {
      throw new BadRequestException(
        'Mật khẩu/xác nhận mật khẩu không chính xác.',
      );
    }

    //check email
    const user = await this.userModel.findOne({ email: data.email });

    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }

    //check expire code
    const isBeforeCheck = dayjs().isBefore(user.codeExpired);

    if (isBeforeCheck) {
      //valid => update password
      const newPassword = await hashPasswordHelper(data.password);
      await user.updateOne({ password: newPassword });
      return {};
    } else {
      throw new BadRequestException('Mã code đã hết hạn');
    }
  }
}
