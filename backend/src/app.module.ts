import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UsersModule } from './users/users.module'
import { AuthModule } from './auth/auth.module'
import { FriendsModule } from './friends/friends.module'
import { RealtimeModule } from './realtime/realtime.module'
import { RoomModule } from './room/room.module'
import { MetricsModule } from './metrics/metrics.module'
import { PublicApiModule } from './public-api/public-api.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.getOrThrow<number>('DB_PORT'),
        username: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        ssl: config.get<string>('DB_SSL') === 'true' ? true : false,
        extra:
          config.get<string>('DB_SSL') === 'true'
            ? { ssl: { rejectUnauthorized: false } }
            : {},
      }),
    }),
    UsersModule,
    AuthModule,
    FriendsModule,
    RealtimeModule,
    RoomModule,
    MetricsModule,
    PublicApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
