import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { TransactionEntity } from 'src/entities/transaction.entity'
import { WalletEntity } from 'src/entities/wallet.entity'
import { DepositWalletInput } from 'src/wallets/inputs/deposit-wallet.input'
import { WithdrawWalletInput } from 'src/wallets/inputs/withdraw-wallet.input'
import { Repository } from 'typeorm'

let withdrawOperationRepeat: Array<number> = []
let depositOperationRepeat: Array<number> = []

const leaveUniqueIds = (arr: Array<number>, operation: string, id: number) => {
    const uniqueIds = [...new Set(arr)]

    if (operation === 'deposit') {
        depositOperationRepeat = uniqueIds.filter((item) => item !== id)
    } else if (operation === 'withdraw') {
        withdrawOperationRepeat = uniqueIds.filter((item) => item !== id)
    }
}

@Injectable()
export class WalletService {
    constructor(
        @InjectRepository(WalletEntity)
        private readonly walletRepository: Repository<WalletEntity>,
        @InjectRepository(TransactionEntity)
        private readonly transactionRepositary: Repository<TransactionEntity>,
    ) {}

    // QUERY

    async getOneWallet(id: number): Promise<WalletEntity> {
        const wallet = await this.walletRepository.findOne({ id })

        if (!wallet) {
            depositOperationRepeat = depositOperationRepeat.filter(
                (ID) => ID !== id,
            )

            throw new HttpException('Wallet not found', HttpStatus.NOT_FOUND)
        }

        return wallet
    }

    async getAllWallets(): Promise<WalletEntity[]> {
        return await this.walletRepository.find()
    }

    // MUTATION

    async createWallet(): Promise<WalletEntity> {
        return this.walletRepository.save({})
    }

    async closeWallet(id: number): Promise<String> {
        const wallet = await this.getOneWallet(id)

        if (!wallet) {
            throw new HttpException('Wallet not found', HttpStatus.NOT_FOUND)
        }

        if (!wallet.status) {
            throw new HttpException(
                'Account already closed',
                HttpStatus.FORBIDDEN,
            )
        }

        await this.walletRepository.update(id, {
            status: false,
            closed_at: new Date(),
        })

        return 'Account closed'
    }

    async depositWallet(depositInput: DepositWalletInput): Promise<Number> {
        depositOperationRepeat.push(depositInput.id)

        if (
            depositOperationRepeat.filter((id) => id === depositInput.id)
                .length === 1
        ) {
            if (
                depositOperationRepeat.filter((id) => id === depositInput.id)
                    .length === 1
            ) {
                const walletId = depositInput.id

                const wallet = await this.getOneWallet(walletId)

                if (!wallet) {
                    throw new HttpException(
                        'Wallet not found',
                        HttpStatus.NOT_FOUND,
                    )
                }

                if (!wallet.status) {
                    depositOperationRepeat = depositOperationRepeat.filter(
                        (id) => id !== walletId,
                    )

                    throw new HttpException(
                        'Account closed',
                        HttpStatus.FORBIDDEN,
                    )
                }

                const balance = wallet.balance + Number(depositInput.sum)

                await this.walletRepository.update(walletId, { balance })

                const transaction = new TransactionEntity()
                transaction.operation = 'deposit'
                transaction.sum = depositInput.sum
                transaction.wallet = wallet

                await this.transactionRepositary.save(transaction)

                depositOperationRepeat = depositOperationRepeat.filter(
                    (id) => id !== walletId,
                )

                return transaction.id
            } else {
                leaveUniqueIds(
                    depositOperationRepeat,
                    'deposit',
                    depositInput.id,
                )

                throw new HttpException(
                    'Operation already in progress',
                    HttpStatus.FORBIDDEN,
                )
            }
        } else {
            leaveUniqueIds(depositOperationRepeat, 'deposit', depositInput.id)

            throw new HttpException(
                'Operation already in progress',
                HttpStatus.FORBIDDEN,
            )
        }
    }

    async withdrawWallet(withdrawInput: WithdrawWalletInput): Promise<Number> {
        withdrawOperationRepeat.push(withdrawInput.id)

        if (
            withdrawOperationRepeat.filter((id) => id === withdrawInput.id)
                .length === 1
        ) {
            if (
                withdrawOperationRepeat.filter((id) => id === withdrawInput.id)
                    .length === 1
            ) {
                const walletId = withdrawInput.id

                const wallet = await this.getOneWallet(walletId)

                if (!wallet) {
                    throw new HttpException(
                        'Wallet not found',
                        HttpStatus.NOT_FOUND,
                    )
                }

                if (!wallet.status) {
                    withdrawOperationRepeat = withdrawOperationRepeat.filter(
                        (id) => id !== walletId,
                    )

                    throw new HttpException(
                        'Account closed',
                        HttpStatus.FORBIDDEN,
                    )
                }

                if (wallet.balance < withdrawInput.sum) {
                    withdrawOperationRepeat = withdrawOperationRepeat.filter(
                        (id) => id !== walletId,
                    )

                    throw new HttpException(
                        'Insufficient funds',
                        HttpStatus.FORBIDDEN,
                    )
                }

                const balance = wallet.balance - Number(withdrawInput.sum)

                await this.walletRepository.update(walletId, { balance })

                const transaction = new TransactionEntity()
                transaction.operation = 'withdraw'
                transaction.sum = withdrawInput.sum
                transaction.wallet = wallet

                await this.transactionRepositary.save(transaction)

                withdrawOperationRepeat = withdrawOperationRepeat.filter(
                    (id) => id !== walletId,
                )

                return transaction.id
            } else {
                leaveUniqueIds(
                    withdrawOperationRepeat,
                    'withdraw',
                    withdrawInput.id,
                )

                throw new HttpException(
                    'Operation already in progress',
                    HttpStatus.FORBIDDEN,
                )
            }
        } else {
            leaveUniqueIds(
                withdrawOperationRepeat,
                'withdraw',
                withdrawInput.id,
            )

            throw new HttpException(
                'Operation already in progress',
                HttpStatus.FORBIDDEN,
            )
        }
    }
}
