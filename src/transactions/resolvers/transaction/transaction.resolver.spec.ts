import { Test, TestingModule } from '@nestjs/testing'
import { TransactionService } from 'src/transactions/services/transaction/transaction.service'
import { TransactionResolver } from './transaction.resolver'

describe('TransactionResolver', () => {
    let resolver: TransactionResolver

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransactionResolver,
                {
                    provide: TransactionService,
                    useFactory: () => ({
                        findAll: jest.fn(() => [
                            {
                                id: 1,
                                operation: 'withdraw',
                                sum: 200,
                            },

                            {
                                id: 2,
                                operation: 'deposit',
                                sum: 100,
                            },
                        ]),
                        findOne: jest.fn((id: string) => ({
                            id: id,
                            operation: 'withdraw',
                            sum: 200,
                        })),
                    }),
                },
            ],
        }).compile()

        resolver = module.get<TransactionResolver>(TransactionResolver)
    })

    it('should be defined', () => {
        expect(resolver).toBeDefined()
    })
})
