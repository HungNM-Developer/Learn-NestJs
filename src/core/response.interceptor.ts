import { RESPONSE_MESSAGE } from '@/decorator/customize';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import dayjs from 'dayjs';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type Response<T> = {
  success: boolean;
  statusCode: number;
  path: string;
  message: string;
  data: T;
  timestamp: string;
};

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next
      .handle()
      .pipe(map((res: unknown) => this.responseHandler(res, context)));
  }

  responseHandler(res: any, context: ExecutionContext) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const statusCode = response.statusCode;
    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE, context.getHandler()) || '';

    return {
      success: true,
      path: request.url,
      message: message,
      statusCode,
      data: res,
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };
  }
}
