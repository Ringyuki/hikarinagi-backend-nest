import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from './../src/app.module'

describe('Application (e2e)', () => {
  let app: INestApplication<App>

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('App Info', () => {
    it('/ (GET) should return app information', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('name', 'Hikarinagi backend nestjs')
          expect(res.body).toHaveProperty('version', '0.0.1')
          expect(res.body).toHaveProperty('environment')
          expect(res.body).toHaveProperty('timestamp')
        })
    })
  })

  describe('Health Check', () => {
    it('/health (GET) should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('status', 'ok')
        })
    })
  })

  describe('User Registration Flow (e2e)', () => {
    it('should handle complete user registration flow', async () => {
      const testEmail = `test-${Date.now()}@example.com`
      const testUser = {
        email: testEmail,
        name: 'testuser',
      }

      // Step 1: Request verification code
      const verificationResponse = await request(app.getHttpServer())
        .post('/user/verification-for-signup')
        .send(testUser)
        .expect(201)

      expect(verificationResponse.body.data).toHaveProperty('uuid')
      expect(verificationResponse.body.data.email).toBe(testEmail)

      // Note: 实际注册需要真实的验证码，这里只测试接口是否正常响应
      // 在真实环境中，你可能需要 mock 邮件服务或使用测试验证码
    })
  })

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', () => {
      return request(app.getHttpServer()).get('/non-existent-route').expect(404)
    })
  })
})
