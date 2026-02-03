import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserInfo } from "../realtime/realtime.events";

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly usersRepo: Repository<User>) {}

  async createUser(email: string, passwordHash: string): Promise<User> {
    const user = this.usersRepo.create({email: email.toLowerCase(), password: passwordHash });
    return await this.usersRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email: email.toLowerCase() } });
  }

  async getUserByid(id: string): Promise<User> {
     return await this.usersRepo.findOneOrFail({ where: { id } });
  }

  async updateProfilePictureId(userId: string, profilePictureId: string | null): Promise<void> {
    await this.usersRepo.update({ id: userId }, { profilePictureId });
  }

  async updateTwoFaSecret(userId: string, twoFaSecret: string | null): Promise<void> {
    await this.usersRepo.update({ id: userId }, { twoFaSecret });
  }

  async enableTwoFa(userId: string): Promise<void> {
    await this.usersRepo.update({ id: userId }, { twoFaEnabled: true });
  }

  async disableTwoFa(userId: string): Promise<void> {
    await this.usersRepo.update({ id: userId }, { twoFaEnabled: false, twoFaSecret: null });
  }

  async getUserInfo(userId: string): Promise<UserInfo>{
    const user = await this.usersRepo.findOneOrFail({ where: { id: userId } });
    return {
      username: user.username,
      profilePictureId: user.profilePictureId
    };
  }
}
