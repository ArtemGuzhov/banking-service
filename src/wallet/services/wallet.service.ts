import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { TransactionEntity } from 'src/transaction/models/transaction.entity'
import { TransactionService } from 'src/transaction/services/transaction.service'
import { UserEntity } from 'src/user/models/user.entity'
import { UserService } from 'src/user/services/user.service'
import { Connection, Repository } from 'typeorm'
import { CloseWalletDto } from '../dtos/close-wallet.dto'
import { DepositWalletDto } from '../dtos/deposit-wallet.dto'
import { TransferWalletDto } from '../dtos/transfer-wallet.dto'
import { WithdrawWalletDto } from '../dtos/withdraw-wallet.dto'
import { WalletEntity } from '../models/wallet.entity'

@Injectable()
export class WalletService {
    constructor(
        @InjectRepository(WalletEntity)
        private readonly walletRepository: Repository<WalletEntity>,
        private readonly transactionService: TransactionService,
        private readonly userService: UserService,
        private connection: Connection,
    ) {}

    // QUERY

    async findOne(id: number, userId?: number): Promise<WalletEntity> {
        try {
            const wallet = await this.walletRepository.findOne(
                userId
                    ? {
                          where: {
                              id,
                              user: {
                                  id: userId,
                              },
                          },
                          relations: ['user', 'transactions'],
                      }
                    : {
                          where: {
                              id,
                          },

                          relations: ['user', 'transactions'],
                      },
            )

            if (!wallet) {
                throw new HttpException(
                    'Wallet not found',
                    HttpStatus.NOT_FOUND,
                )
            }

            return wallet
        } catch (error) {
            console.log(`Server error(WalletService: findOne): ${error}`)

            throw error
        }
    }

    async findAll(): Promise<WalletEntity[]> {
        try {
            return await this.walletRepository.find({
                relations: ['user', 'transactions'],
            })
        } catch (error) {
            console.log(`Server error(WalletService: findAll): ${error}`)

            throw error
        }
    }

    // MUTATION

    async create(id: number): Promise<WalletEntity> {
        try {
            const user = await this.userService.findOne(id)

            return this.walletRepository.save({ user })
        } catch (error) {
            console.log(`Server error(WalletService: create): ${error}`)

            throw error
        }
    }

    async close(closeDto: CloseWalletDto): Promise<String> {
        try {
            const { userId, walletId } = closeDto

            await this.userService.findOne(userId)

            const wallet = await this.findOne(walletId)

            if (!wallet) {
                throw new HttpException(
                    'Wallet not found',
                    HttpStatus.NOT_FOUND,
                )
            }

            if (!wallet.status) {
                throw new HttpException(
                    'Account already closed',
                    HttpStatus.FORBIDDEN,
                )
            }

            await this.walletRepository.update(walletId, {
                status: false,
                closed_at: new Date(),
            })

            return 'Account closed'
        } catch (error) {
            console.log(`Server error(WalletService: close): ${error}`)

            throw error
        }
    }

    async deposit(depositDto: DepositWalletDto): Promise<Number> {
        try {
            const { walletId, userId, sum } = depositDto

            await this.userService.findOne(userId)

            const wallet = await this.findOne(walletId, userId)

            if (!wallet.status) {
                throw new HttpException('Account closed', HttpStatus.FORBIDDEN)
            }

            const balance = wallet.balance + Number(sum)

            await this.walletRepository.update(walletId, { balance })

            const transaction = await this.transactionService.create({
                operation: 'deposit',
                sum,
                wallet,
            })

            return transaction.id
        } catch (error) {
            console.log(`Server error(WalletService: deposit): ${error}`)

            throw error
        }
    }

    async withdraw(withdrawDto: WithdrawWalletDto): Promise<Number> {
        try {
            const { userId, walletId, sum } = withdrawDto

            await this.userService.findOne(userId)

            const wallet = await this.findOne(walletId, userId)

            if (!wallet.status) {
                throw new HttpException('Account closed', HttpStatus.FORBIDDEN)
            }

            if (wallet.balance < sum) {
                throw new HttpException(
                    'Insufficient funds',
                    HttpStatus.FORBIDDEN,
                )
            }

            const balance = wallet.balance - Number(sum)

            await this.walletRepository.update(walletId, { balance })

            const transaction = await this.transactionService.create({
                operation: 'withdraw',
                sum,
                wallet,
            })

            return transaction.id
        } catch (error) {
            console.log(`Server error(WalletService: withdraw): ${error}`)

            throw error
        }
    }

    /*
        Посчитал нужным оставить создание транзакций для каждого кошелька, если перевод идет между своими счетами.
    */
    async transfer(transferDto: TransferWalletDto): Promise<Number> {
        try {
            const { from, to, sum } = transferDto

            const queryRunner = this.connection.createQueryRunner()

            await queryRunner.connect()

            await queryRunner.startTransaction()

            const senderWallet = await queryRunner.manager.findOne(
                WalletEntity,
                {
                    where: {
                        id: from,
                    },
                    relations: ['user'],
                },
            )

            if (!senderWallet) {
                throw new HttpException(
                    'Sender`s wallet not found',
                    HttpStatus.NOT_FOUND,
                )
            }

            if (!senderWallet.status) {
                throw new HttpException(
                    'Sender`s wallet closed',
                    HttpStatus.FORBIDDEN,
                )
            }

            const sender = await queryRunner.manager.findOne(UserEntity, {
                where: {
                    id: senderWallet.user.id,
                },
            })

            if (!sender) {
                throw new HttpException(
                    'Sender wallet user not found',
                    HttpStatus.NOT_FOUND,
                )
            }

            const recipientWallet = await queryRunner.manager.findOne(
                WalletEntity,
                {
                    where: {
                        id: to,
                    },
                    relations: ['user'],
                },
            )

            if (!recipientWallet) {
                throw new HttpException(
                    'Recipient`s wallet not found',
                    HttpStatus.NOT_FOUND,
                )
            }

            if (!recipientWallet.status) {
                throw new HttpException(
                    'Recipient`s wallet closed',
                    HttpStatus.FORBIDDEN,
                )
            }

            const recipient = await queryRunner.manager.findOne(UserEntity, {
                where: {
                    id: recipientWallet.user.id,
                },
            })

            if (!recipient) {
                throw new HttpException(
                    'Recipient wallet user not found',
                    HttpStatus.NOT_FOUND,
                )
            }

            if (senderWallet.balance < sum) {
                throw new HttpException(
                    'Insufficient funds',
                    HttpStatus.FORBIDDEN,
                )
            }

            const balances = {
                sender: senderWallet.balance - sum,
                recipient: recipientWallet.balance + sum,
            }

            try {
                await queryRunner.manager.update(
                    WalletEntity,
                    senderWallet.id,
                    { balance: balances.sender },
                )

                await queryRunner.manager.update(
                    WalletEntity,
                    recipientWallet.id,
                    { balance: balances.recipient },
                )

                const senderResult = await queryRunner.manager.save(
                    TransactionEntity,
                    {
                        operation: 'transfer',
                        sum,
                        wallet: senderWallet,
                        from,
                        to,
                    },
                )

                await queryRunner.manager.save(TransactionEntity, {
                    operation: 'receipt',
                    sum,
                    wallet: recipientWallet,
                    from,
                    to,
                })

                await queryRunner.commitTransaction()

                return senderResult.id
            } catch (error) {
                await queryRunner.rollbackTransaction()

                console.log(`Transfer error: ${error}`)

                throw error
            } finally {
                await queryRunner.release()
            }
        } catch (error) {
            console.log(`Server error(WalletService: transfer): ${error}`)

            throw error
        }
    }
}
