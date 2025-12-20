import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FriendsModule } from "./friends.module";
import { User } from "../users/user.entity";
import { FriendRequest } from "./entities/friend-request.entity";
import { Friendship } from "./entities/friendship.entity";
import { DirectMessage } from "./entities/direct-message.entity";
import { UserPresence } from "./entities/user-presence.entity";
import { FriendsService } from "./friends.service";

describe("FriendsService (integration)", () => {
  let app: INestApplication;
  let service: FriendsService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          dropSchema: true,
          entities: [User, FriendRequest, Friendship, DirectMessage, UserPresence],
          synchronize: true,
        }),
        FriendsModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    service = moduleRef.get(FriendsService);

    const usersRepo = moduleRef.get("UserRepository");
    await usersRepo.save([
      {
        id: "00000000-0000-0000-0000-000000000001",
        email: "a@a.com",
        username: "a",
        password: "x",
        profilePictureId: null,
        twoFaEnabled: false,
        twoFaSecret: null,
        createdAt: new Date(),
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        email: "b@b.com",
        username: "b",
        password: "x",
        profilePictureId: null,
        twoFaEnabled: false,
        twoFaSecret: null,
        createdAt: new Date(),
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates friendship by accepting request and can send messages", async () => {
    const a = "00000000-0000-0000-0000-000000000001";
    const b = "00000000-0000-0000-0000-000000000002";

    const req = await service.sendFriendRequest(a, b);
    await service.acceptRequest(req.id, b);

    const msg = await service.sendDirectMessage(a, b, "hello");
    expect(msg.content).toBe("hello");

    const page = await service.getDirectMessages(a, b, { limit: 10 });
    expect(page.messages).toHaveLength(1);
    expect(page.messages[0].id).toBe(msg.id);
  });
});

