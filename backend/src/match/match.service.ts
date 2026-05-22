import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Match } from './match.entity'
import { CreateMatchInput } from './dto'
import { MatchUserResult } from './match-user-result.entity'

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match) private readonly matchRepo: Repository<Match>,
  ) {}

  async createMatch(input: CreateMatchInput) {
    await this.matchRepo.manager.transaction(async (manager) => {
      const match = await manager.save(
        manager.create(Match, {
          durationSeconds: input.durationSeconds,
        }),
      )

      const resultEntities = input.results.map((result) =>
        manager.create(MatchUserResult, {
          matchId: match.id,
          userId: result.userId,
          score: result.score,
          lines: result.lines,
          level: result.level,
          rank: result.rank,
        }),
      )

      if (resultEntities.length > 0) {
        await manager.save(MatchUserResult, resultEntities)
      }
    })
  }
}
