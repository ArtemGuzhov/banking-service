import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TransactionEntity } from '../../../entities/transaction.entity'
import { TransactionService } from './transaction.service'

type MockType<T> = {
    [P in keyof T]?: jest.Mock<{}>
}

describe('TransactionService', () => {
    let service: TransactionService

    const transactionRepositoryMock: MockType<Repository<TransactionEntity>> = {
        findOne: jest.fn(),
        find: jest.fn(),
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransactionService,
                {
                    provide: getRepositoryToken(TransactionEntity),
                    useValue: transactionRepositoryMock,
                },
            ],
        }).compile()
        service = module.get<TransactionService>(TransactionService)
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    describe('getOneTransaction', () => {
        it('should find one transaction', async () => {
            const transaction = {
                id: 1,
                operation: 'withdraw',
                sum: 200,
            }

            transactionRepositoryMock.findOne?.mockReturnValue(transaction)

            const foundTransaction = await service.getOneTransaction(
                transaction.id,
            )

            expect(foundTransaction).toMatchObject(transaction)

            expect(transactionRepositoryMock.findOne).toHaveBeenCalled()
        })
    })

    describe('getTransactions', () => {
        it('should find all transactions', async () => {
            const transactions = [
                {
                    id: 1,
                    operation: 'withdraw',
                    sum: 200,
                },

                {
                    id: 1,
                    operation: 'deposit',
                    sum: 100,
                },
            ]

            transactionRepositoryMock.find?.mockReturnValue(transactions)

            const foundTransactions = await service.getTransactions()

            expect(foundTransactions).toContainEqual({
                id: 1,
                operation: 'withdraw',
                sum: 200,
            })

            expect(transactionRepositoryMock.find).toHaveBeenCalled()
        })
    })
})
