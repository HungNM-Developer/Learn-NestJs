import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public, ResponseMessage } from '@/decorator/customize';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ResponseMessage('Fetch user successfully')
  @ApiBearerAuth()
  async findAll(
    @Query() query: string,
    @Query('pageNumber') pageNumber: string,
    @Query('pageSize') pageSize: string,
  ) {
    // +: dùng để convert string to number
    return this.usersService.findAll(query, +pageNumber, +pageSize);
  }

  @Get(':id')
  @Public()
  findOneById(@Param('id') id: string) {
    return this.usersService.findOneById(id);
  }

  @Get(':email')
  @Public()
  findOneByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Patch()
  update(@Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
