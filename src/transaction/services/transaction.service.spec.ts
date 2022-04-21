import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { plainToClass } from 'class-transformer'
import { TransactionEntity } from '../models/transaction.entity'
import { TransactionService } from './transaction.service'

const arrayTransactions: TransactionEntity[] = [
    new TransactionEntity(),
    new TransactionEntity(),
    new TransactionEntity(),
]

const oneTransaction: TransactionEntity = plainToClass(TransactionEntity, {
    id: 1,
    operation: 'withdraw',
    sum: 100,
    created_at: new Date(),
})

describe('TransactionService', () => {
    let service: TransactionService

    const mockedRepo = {
        find: jest.fn(() => Promise.resolve(arrayTransactions)),
        findOne: jest.fn(() => Promise.resolve(oneTransaction)),
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransactionService,
                {
                    provide: getRepositoryToken(TransactionEntity),
                    useValue: mockedRepo,
                },
            ],
        }).compile()
        service = module.get<TransactionService>(TransactionService)
    })

    afterEach(() => jest.clearAllMocks())

    it('should be defined', async () => {
        expect(service).toBeDefined()
    })

    describe('findAll', () => {
        it('should return an array of transactions', async () => {
            const find = jest.spyOn(mockedRepo, 'find')

            const transactions = await service.findAll()

            expect(find).toBeCalledTimes(1)
            expect(transactions).toEqual(
                expect.arrayContaining(arrayTransactions),
            )
        })
    })

    describe('findOne', () => {
        it('should return one transaction', async () => {
            const findOne = jest.spyOn(mockedRepo, 'findOne')

            const transaction = await service.findOne(oneTransaction.id)

            expect(findOne).toBeCalledTimes(1)
            expect(findOne).toHaveBeenCalledWith(oneTransaction.id)
            expect(transaction).toEqual(oneTransaction)
        })
    })
})
