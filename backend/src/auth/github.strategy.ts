import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-github2'

export type GithubProfile = {
  id: string
  username?: string
  displayName?: string
  emails?: Array<{ value: string }>
  photos?: Array<{ value: string }>
}

export type GithubValidateReturn = {
  githubId: string
  username: string
  email: string
  avatarUrl: string
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    })
  }

  validate(accessToken: string, refreshToken: string, profile: GithubProfile) {
    return {
      githubId: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value?.toLowerCase(),
      avatarUrl: profile.photos?.[0]?.value,
    }
  }
}
