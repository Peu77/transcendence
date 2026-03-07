import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { GithubAuthGuard } from '../src/auth/github-auth.guard'

// In e2e we don’t want to call GitHub.
// We override the guard so it injects a fake req.user like Passport would.
class GithubAuthGuardMock {
  canActivate(context: any) {
    const req = context.switchToHttp().getRequest()
    req.user = { githubId: 'gh_123', email: 'gh@example.com' }
    return true
  }
}

describe('GitHub OAuth (e2e)', () => {
  let app: INestApplication<App>

  beforeAll(async () => {
    // Provide required env vars for the strategy constructor.
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test_jwt_secret'
    process.env.DB_HOST = process.env.DB_HOST ?? 'localhost'
    process.env.DB_PORT = process.env.DB_PORT ?? '5432'
    process.env.DB_USER = process.env.DB_USER ?? 'postgres'
    process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'postgres'
    process.env.DB_NAME = process.env.DB_NAME ?? 'test'
    process.env.GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? 'x'
    process.env.GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? 'y'
    process.env.GITHUB_CALLBACK_URL =
      process.env.GITHUB_CALLBACK_URL ?? 'http://localhost/auth/github/callback'

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(GithubAuthGuard)
      .useClass(GithubAuthGuardMock)
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /auth/github/callback sets token cookie', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/github/callback')
      .expect(200)

    const setCookie = res.headers['set-cookie'] as string | string[] | undefined
    expect(setCookie).toBeDefined()

    const cookieHeader = Array.isArray(setCookie)
      ? setCookie.join(';')
      : setCookie
    expect(cookieHeader).toContain('token=')
  })
})
