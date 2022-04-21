import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { plainToClass } from 'class-transformer'
import { UserEntity } from '../models/user.entity'
import { UserService } from './user.service'

const arrayUsers: UserEntity[] = [
    new UserEntity(),
    new UserEntity(),
    new UserEntity(),
]

const oneUser: UserEntity = plainToClass(UserEntity, {
    id: 1,
    name: 'artem',
    email: 'artem@mail.ru',
    created_at: new Date(),
    updated_at: new Date(),
    wallets: [],
})

describe('UserService', () => {
    let service: UserService

    const mockedRepo = {
        find: jest.fn(() => Promise.resolve(arrayUsers)),
        findOne: jest.fn(() => Promise.resolve(oneUser)),
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: getRepositoryToken(UserEntity),
                    useValue: mockedRepo,
                },
            ],
        }).compile()

        service = module.get<UserService>(UserService)
    })

    afterEach(() => jest.clearAllMocks())

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('findAll', () => {
        it('should return an array of transactions', async () => {
            const find = jest.spyOn(mockedRepo, 'find')

            const users = await service.findAll()

            expect(find).toBeCalledTimes(1)
            expect(users).toEqual(expect.arrayContaining(arrayUsers))
        })
    })

    describe('findOne', () => {
        it('should return one transaction', async () => {
            const findOne = jest.spyOn(mockedRepo, 'findOne')

            const user = await service.findOne(oneUser.id)

            expect(findOne).toBeCalledTimes(1)
            expect(user).toEqual(oneUser)
        })
    })
})
