import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ApiKey } from './api-key.entity'
import { PublicApiController } from './public-api.controller'
import { PublicApiGuard } from './public-api.guard'
import { PublicApiService } from './public-api.service'

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey])],
  controllers: [PublicApiController],
  providers: [PublicApiService, PublicApiGuard],
})
export class PublicApiModule {}
