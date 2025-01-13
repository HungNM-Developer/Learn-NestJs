import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// For Hot Reload
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const port = configService.get('PORT');

  app.setGlobalPrefix('api/v1', { exclude: [''] });

  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('This is the API documentation for the application.')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('API')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  // Todo (HungNM): Cơ chế xác thực của NestJS
  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: Những cái thuộc tính nào không quy định (không có trong phần whitelist) sẽ không được thêm vào
      // Ví dụ: User có name, email, password mà "whitelist" là false thì nó tự động bỏ
      // tránh trường hợp thừa thông tin khi update user
      whitelist: true,

      // forbidNonWhitelisted: Sẽ tự động quăng ra exception khi client truyền truyền field sai
      forbidNonWhitelisted: true,
    }),
  );

  //config cors
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    credentials: true,
  });

  await app.listen(port);

  // For Hot Reload
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
