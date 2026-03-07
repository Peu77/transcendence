import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { io, Socket } from 'socket.io-client'
import { AppModule } from '../src/app.module'
import { AuthService } from '../src/auth/auth.service'

describe('RealtimeGateway (e2e)', () => {
  let app: INestApplication
  let httpServer: any
  let port: number
  let authService: AuthService

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret'
    process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000'

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()

    authService = app.get(AuthService)

    httpServer = app.getHttpServer()
    await new Promise<void>((resolve) => httpServer.listen(0, resolve))

    const addr = httpServer.address()
    port = typeof addr === 'object' && addr ? addr.port : 0
  })

  afterAll(async () => {
    if (httpServer) {
      await new Promise<void>((resolve) => httpServer.close(() => resolve()))
    }
    if (app) await app.close()
  })

  it('connects to /live and receives ready when authenticated', async () => {
    const token = authService.createUserToken('user-1')

    const socket: Socket = io(`http://localhost:${port}/live`, {
      transports: ['websocket'],
      auth: { token },
      forceNew: true,
      reconnection: false,
    })

    const ready = await new Promise<{ userId: string }>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('timeout')), 2000)
      socket.on('ready', (payload) => {
        clearTimeout(t)
        resolve(payload)
      })
      socket.on('connect_error', (err) => {
        clearTimeout(t)
        reject(err)
      })
    })

    expect(ready.userId).toBe('user-1')
    socket.disconnect()
  })

  it('disconnects when not authenticated', async () => {
    const socket: Socket = io(`http://localhost:${port}/live`, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    })

    await expect(
      new Promise<void>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('timeout')), 2000)
        socket.on('ready', () => {
          clearTimeout(t)
          reject(new Error('should not get ready'))
        })
        socket.on('disconnect', () => {
          clearTimeout(t)
          resolve()
        })
        socket.on('connect_error', () => {
          // server may reject during handshake
          clearTimeout(t)
          resolve()
        })
      }),
    ).resolves.toBeUndefined()

    socket.disconnect()
  })
})
