import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import * as request from 'supertest'

import { AppModule } from '../src/app.module'

const gql = '/graphql'

describe('AppController (e2e)', () => {
    let app: INestApplication

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

    describe(gql, () => {
        describe('status wallets', () => {
            it('should get 200 status wallets', () => {
                return request(app.getHttpServer())
                    .post(gql)
                    .send({
                        query: '{wallets { id } }',
                    })
                    .expect((res) => {
                        expect(res.statusCode).toEqual(200)
                    })
            })
        })

        describe('status wallet', () => {
            it('should get 200 status wallet', () => {
                return request(app.getHttpServer())
                    .post(gql)
                    .send({
                        query: '{wallet(id: 1){ id } }',
                    })
                    .expect((res) => {
                        expect(res.statusCode).toEqual(200)
                    })
            })
        })

        describe('status transaction', () => {
            it('should get 200 status transaction', () => {
                return request(app.getHttpServer())
                    .post(gql)
                    .send({
                        query: '{transaction(id: 1){ id } }',
                    })
                    .expect((res) => {
                        expect(res.statusCode).toEqual(200)
                    })
            })
        })

        describe('status transactions', () => {
            it('should get 200 status transactions', () => {
                return request(app.getHttpServer())
                    .post(gql)
                    .send({
                        query: '{transactions{ id } }',
                    })
                    .expect((res) => {
                        expect(res.statusCode).toEqual(200)
                    })
            })
        })

        describe('status user', () => {
            it('should get 200 status user', () => {
                return request(app.getHttpServer())
                    .post(gql)
                    .send({
                        query: '{user(id: 1){ id } }',
                    })
                    .expect((res) => {
                        expect(res.statusCode).toEqual(200)
                    })
            })
        })

        describe('status users', () => {
            it('should get 200 status users', () => {
                return request(app.getHttpServer())
                    .post(gql)
                    .send({
                        query: '{users{ id } }',
                    })
                    .expect((res) => {
                        expect(res.statusCode).toEqual(200)
                    })
            })
        })
    })
})
