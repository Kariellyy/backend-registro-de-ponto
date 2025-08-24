import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração global de validação
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configuração do CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:4000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Sistema de Registro de Ponto')
    .setDescription('API para controle de ponto eletrônico para empresas')
    .setVersion('1.0')
    .addTag('funcionarios', 'Operações relacionadas a funcionários')
    .addTag('ponto', 'Operações relacionadas a registros de ponto')
    .addTag('ausencias', 'Operações relacionadas a ausências')
    .addTag('ferias', 'Operações relacionadas a férias')
    .addTag('justificativas', 'Operações relacionadas a justificativas')
    .addTag('dashboard', 'Operações relacionadas ao dashboard')
    .addTag('relatorios', 'Operações relacionadas a relatórios')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Prefixo global para todas as rotas
  app.setGlobalPrefix('v1');

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  console.log(`🚀 Aplicação rodando em: http://localhost:${port}`);
  console.log(`📚 Documentação Swagger: http://localhost:${port}/v1/docs`);
}
bootstrap();
