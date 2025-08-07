import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        
        if (isProduction) {
          return {
            type: 'postgres',
            host: configService.get<string>('DB_HOST'),
            port: configService.get<number>('DB_PORT'),
            username: configService.get<string>('DB_USERNAME'),
            password: configService.get<string>('DB_PASSWORD'),
            database: configService.get<string>('DB_DATABASE'),
            entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
            migrations: [__dirname + '/migrations/*{.ts,.js}'],
            synchronize: true,
            ssl: {
              rejectUnauthorized: false,
            },
          };
        }
        
        // Configuração para desenvolvimento com SQLite
        return {
          type: 'sqlite',
          database: './dev.db',
          entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
          synchronize: true,
          logging: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
