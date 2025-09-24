import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Room } from '../rooms/entities/room.entity';
import { RoomMember } from '../rooms/entities/room-member.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get('DB_TYPE') || 'sqlite';

        if (dbType === 'sqlite') {
          return {
            type: 'sqlite',
            database: configService.get('DB_DATABASE') || './data/interview_system.db',
            entities: [User, Room, RoomMember],
            synchronize: configService.get('DB_SYNCHRONIZE') === 'true' || configService.get('NODE_ENV') === 'development',
            logging: configService.get('DB_LOGGING') === 'true' || configService.get('NODE_ENV') === 'development',
          };
        } else {
          const mysqlConfig: any = {
            type: 'mysql',
            host: configService.get('DB_HOST') || 'localhost',
            port: +configService.get('DB_PORT') || 3306,
            username: configService.get('DB_USERNAME'),
            password: configService.get('DB_PASSWORD'),
            database: configService.get('DB_DATABASE'),
            entities: [User, Room, RoomMember],
            synchronize: configService.get('DB_SYNCHRONIZE') === 'true' || configService.get('NODE_ENV') === 'development',
            logging: configService.get('DB_LOGGING') === 'true' || configService.get('NODE_ENV') === 'development',
            charset: configService.get('DB_CHARSET') || 'utf8mb4',
            timezone: configService.get('DB_TIMEZONE') || '+08:00',
          };

          // 添加SSL配置
          if (configService.get('DB_SSL') === 'true') {
            mysqlConfig.ssl = true;
          } else if (configService.get('DB_SSL') === 'false') {
            mysqlConfig.ssl = false;
          }

          // 添加连接池配置
          const connectionLimit = configService.get('DB_CONNECTION_LIMIT');
          if (connectionLimit) {
            mysqlConfig.extra = {
              connectionLimit: +connectionLimit,
            };
          }

          return mysqlConfig;
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
