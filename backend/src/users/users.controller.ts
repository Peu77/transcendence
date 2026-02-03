import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Res,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { createReadStream } from "node:fs";
import { Response } from "express";
import * as speakeasy from "speakeasy";
import { UsersService } from "./users.service";
import { AuthGuard, UserId } from "../auth/auth.guard";
import { ProfilePictureDto, VerifyTwoFaDto } from "./dto";

const UPLOAD_DIR = "uploads/";

@Controller()
@UseGuards(AuthGuard)
export class UsersController {

  constructor(
    private readonly usersService: UsersService,
  ) {
  }

  @Get("users/me")
  async getMe(@UserId() userId: string) {
    const user = await this.usersService.getUserByid(userId);
    return {
      id: user.id,
      email: user.email,
      profilePictureId: user.profilePictureId,
      twoFaEnabled: user.twoFaEnabled,
      username: user.username,
    };
  }

  @Post("users/profilePicture")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: async (_req, _file, cb) => {
          await fs.mkdir(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (file.mimetype && !file.mimetype.startsWith("image/")) {
          return cb(
            new BadRequestException(
              "Invalid file type. Only images are allowed",
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    @UserId() userId: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    const user = await this.usersService.getUserByid(userId);

    if (user.profilePictureId) {
      await fs.unlink(path.join(UPLOAD_DIR, user.profilePictureId));
    }

    await this.usersService.updateProfilePictureId(user.id, file.filename);
    return {
      message: "Profile picture uploaded successfully",
      profilePictureId: file.filename,
    };
  }

  @Get("users/profilePicture/:id")
  async getProfilePicture(
    @Param() params: ProfilePictureDto,
    @Res() res: Response,
  ) {
    const filepath = path.join(UPLOAD_DIR, params.id);
    try {
      await fs.access(filepath);
    } catch {
      throw new BadRequestException("Profile picture not found");
    }

    res.setHeader("Cache-Control", "public, max-age=600");
    const stream = createReadStream(filepath);
    stream.pipe(res);
  }

  @Post("users/2fa/generate")
  async generateTwoFaSecret(@UserId() userId: string) {
    const user = await this.usersService.getUserByid(userId);
    if (user.twoFaEnabled) {
      throw new BadRequestException("2FA is already enabled");
    }

    const secret = speakeasy.generateSecret({
      name: `Transcendence (${user.email})`,
    });

    await this.usersService.updateTwoFaSecret(userId, secret.base32);

    return {
      otpauthUrl: secret.otpauth_url,
      base32: secret.base32,
    };
  }

  @Post("users/2fa/enable")
  async enableTwoFa(
    @UserId() userId: string,
    @Body() body: VerifyTwoFaDto,
  ) {
    const user = await this.usersService.getUserByid(userId);
    if (user.twoFaEnabled) {
      throw new BadRequestException("2FA is already enabled");
    }
    if (!user.twoFaSecret) {
      throw new BadRequestException("2FA secret not generated");
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFaSecret,
      encoding: "base32",
      token: body.code,
    });

    if (!verified) {
      throw new BadRequestException("Invalid OTP code");
    }

    await this.usersService.enableTwoFa(userId);
    return { message: "2FA enabled successfully" };
  }

  @Post("users/2fa/disable")
  async disableTwoFa(
    @UserId() userId: string,
    @Body() body: VerifyTwoFaDto,
  ) {
    const user = await this.usersService.getUserByid(userId);
    if (!user.twoFaEnabled) {
      throw new BadRequestException("2FA is not enabled");
    }
    if (!user.twoFaSecret) {
      throw new BadRequestException("2FA secret not found");
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFaSecret,
      encoding: "base32",
      token: body.code,
    });

    if (!verified) {
      throw new BadRequestException("Invalid OTP code");
    }

    await this.usersService.disableTwoFa(userId);
    return { message: "2FA disabled successfully" };
  }
}
