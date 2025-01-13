export class ResponseDto<T> {
  statusCode: number;
  message: string;
  data: T;

  constructor(data: T, statusCode: number, message: string) {
    this.data = data;
    this.statusCode = statusCode;
    this.message = message;

    return this;
  }
}
