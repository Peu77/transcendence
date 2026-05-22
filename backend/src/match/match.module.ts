import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Match } from './match.entity'
import { MatchUserResult } from './match-user-result.entity'
import { MatchService } from './match.service'
import { MatchController } from './match.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Match, MatchUserResult])],
  providers: [MatchService],
  controllers: [MatchController],
  exports: [MatchService],
})
export class MatchModule {}
