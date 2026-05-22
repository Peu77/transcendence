import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { MatchService } from './match.service'
import { AuthGuard } from '../auth/auth.guard'

@UseGuards(AuthGuard)
@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}
}
