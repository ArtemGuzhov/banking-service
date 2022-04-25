import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { plainToClass } from 'class-transformer'
import { WalletEntity } from '../models/wallet.entity'
import { WalletService } from './wallet.service'

const arrayWallets: WalletEntity[] = [
    new WalletEntity(),
    new WalletEntity(),
    new WalletEntity(),
]

const oneWallet: WalletEntity = plainToClass(WalletEntity, {
    id: 1,
    balance: 1,
    status: true,
    user: {
        id: 1,
    },
})

describe('WalletService', () => {
    let service: WalletService

    const mockedRepo = {
        find: jest.fn(() => Promise.resolve(arrayWallets)),
        findOne: jest.fn(() => Promise.resolve(oneWallet)),
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WalletService,
                {
                    provide: getRepositoryToken(WalletEntity),
                    useValue: mockedRepo,
                },
            ],
        }).compile()
        service = module.get<WalletService>(WalletService)
    })

    afterEach(() => jest.clearAllMocks())

    it('should be defined', async () => {
        expect(service).toBeDefined()
    })
})
