import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import dayjs from 'dayjs';

@Catch(HttpException)
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Customize duplicate error handling
    const exceptionResponse = exception.getResponse();
    let message = 'An error occurred';

    // Extract meaningful message
    if (typeof exceptionResponse === 'object' && exceptionResponse['message']) {
      message = exceptionResponse['message'];
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      message,
      data: {},
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    });
  }
}
