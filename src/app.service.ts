import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello Hùng Nguyễn test hot reload!';
  }
}
