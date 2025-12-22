import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { FriendsService } from "../src/friends/friends.service";
import { User } from "../src/users/user.entity";
import { TwoFa } from "../src/auth/twofa.entity";
import { FriendRequest } from "../src/friends/entities/friend-request.entity";
import { Friendship } from "../src/friends/entities/friendship.entity";
import { DirectMessage } from "../src/friends/entities/direct-message.entity";
import { UserPresence } from "../src/friends/entities/user-presence.entity";
import { FriendsModule } from "../src/friends/friends.module";
import { Repository } from "typeorm";


describe("FriendsService (integration)", () => {
  let app: INestApplication;
  let service: FriendsService;

  let userA: User;
  let userB: User;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            type: "postgres",
            host: config.getOrThrow<string>("DB_HOST"),
            port: config.getOrThrow<number>("DB_PORT"),
            username: config.getOrThrow<string>("DB_USER"),
            password: config.getOrThrow<string>("DB_PASSWORD"),
            database: config.getOrThrow<string>("DB_NAME"),
            schema: "test",
            entities: [
              User,
              TwoFa,
              FriendRequest,
              Friendship,
              DirectMessage,
              UserPresence,
            ],
            synchronize: true,
          }),
        }),
        FriendsModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    service = moduleRef.get(FriendsService);


    const usersRepo: Repository<User> = moduleRef.get("UserRepository");


  const result =  await usersRepo.save([
      {
        email: "a@a.com",
        username: "a",
        password: "x",
        profilePictureId: null,
        twoFaEnabled: false,
        twoFaSecret: null,
        createdAt: new Date(),
      },
      {
        email: "b@b.com",
        username: "b",
        password: "x",
        profilePictureId: null,
        twoFaEnabled: false,
        twoFaSecret: null,
        createdAt: new Date(),
      },
    ]);

    userA = result[0];
    userB = result[1];
  });

  afterAll(async () => {
    const usersRepo: Repository<User> = app.get("UserRepository");
    await usersRepo.delete(userA.id);
    await usersRepo.delete(userB.id);
    if (app) await app.close();
  });

  it("creates friendship by accepting request and can send messages", async () => {
    const usersRepo = app.get("UserRepository");
    const a = (await usersRepo.findOneByOrFail({ username: "a" })).id;
    const b = (await usersRepo.findOneByOrFail({ username: "b" })).id;

    const req = await service.sendFriendRequest(a, b);
    await service.acceptRequest(req.id, b);

    const msg = await service.sendDirectMessage(a, b, "hello");
    expect(msg.content).toBe("hello");

    const page = await service.getDirectMessages(a, b, { limit: 10 });
    expect(page.messages).toHaveLength(1);
    expect(page.messages[0].id).toBe(msg.id);
  });
});
