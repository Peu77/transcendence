import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Theme, User, UserType } from './user.entity'
import { UserInfo } from '../realtime/realtime.events'
import { GithubValidateReturn } from '../auth/github.strategy'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  static readonly UPLOAD_DIR = 'uploads/'

  async createUser(
    userType: UserType,
    email: string,
    username: string,
    passwordHash: string | null,
    githubId: string | null,
    githubAvatarUrl: string | null,
  ): Promise<User> {
    const user = this.usersRepo.create({
      userType,
      email: email.toLowerCase(),
      username: username,
      password: passwordHash,
      githubId,
      githubAvatarUrl,
    })
    return await this.usersRepo.save(user)
  }

  async existsByEmail(email: string): Promise<boolean> {
    return await this.usersRepo.existsBy({ email: email.toLowerCase() })
  }

  async existsByUsername(username: string): Promise<boolean> {
    return await this.usersRepo.existsBy({ username })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email: email.toLowerCase() } })
  }

  async findByGithubId(githubId: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { githubId, userType: UserType.GITHUB },
    })
  }

  async upsertGithubUser(profile: GithubValidateReturn): Promise<User> {
    const byGithub = await this.findByGithubId(profile.githubId)
    if (byGithub) return byGithub

    return this.createUser(
      UserType.GITHUB,
      profile.email,
      profile.username,
      null,
      profile.githubId,
      profile.avatarUrl,
    )
  }

  async getUserByid(id: string): Promise<User> {
    return await this.usersRepo.findOneOrFail({ where: { id } })
  }

  async updateProfilePictureId(
    userId: string,
    profilePictureId: string | null,
  ): Promise<void> {
    await this.usersRepo.update({ id: userId }, { profilePictureId })
  }

  async updateTwoFaSecret(
    userId: string,
    twoFaSecret: string | null,
  ): Promise<void> {
    await this.usersRepo.update({ id: userId }, { twoFaSecret })
  }

  async enableTwoFa(userId: string): Promise<void> {
    await this.usersRepo.update({ id: userId }, { twoFaEnabled: true })
  }

  async disableTwoFa(userId: string): Promise<void> {
    await this.usersRepo.update(
      { id: userId },
      { twoFaEnabled: false, twoFaSecret: null },
    )
  }

  async toggleTheme(userId: string): Promise<Theme> {
    const user = await this.usersRepo.findOneOrFail({ where: { id: userId } })
    const newTheme = user.theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT
    await this.usersRepo.update({ id: userId }, { theme: newTheme })
    return newTheme
  }

  async getPublicProfile(userId: string) {
    const user = await this.usersRepo.findOneOrFail({ where: { id: userId } })
    return {
      id: user.id,
      username: user.username,
      profilePictureId: user.profilePictureId,
      level: user.level,
      createdAt: user.createdAt,
    }
  }

  async getUserInfo(userId: string): Promise<UserInfo> {
    const user = await this.usersRepo.findOneOrFail({ where: { id: userId } })
    return {
      username: user.username,
      profilePictureId: user.profilePictureId,
    }
  }

  async existUserProfilePictureInFs(
    profilePictureId: string,
  ): Promise<boolean> {
    try {
      console.log('Checking if profile picture exists:', profilePictureId)
      console.log('Upload directory:', UsersService.UPLOAD_DIR)
      await fs.access(path.join(UsersService.UPLOAD_DIR, profilePictureId))
      return true
    } catch (e) {
      console.log('Profile picture does not exist:', e)
      return false
    }
  }
}
