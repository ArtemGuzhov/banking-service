import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { TransactionEntity } from 'src/transaction/models/transaction.entity'
import { TransactionService } from 'src/transaction/services/transaction.service'
import { UserEntity } from 'src/user/models/user.entity'
import { UserService } from 'src/user/service/user.service'
import { Connection, Repository } from 'typeorm'
import {
    IClose,
    IDeposit,
    ITransfer,
    IWithdraw,
} from '../interfaces/wallet-service.interface'
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

    async findAll(filter?: string): Promise<WalletEntity[]> {
        try {
            const walletsWithFilter = async (status: boolean) => {
                return await this.walletRepository.find({
                    where: {
                        status,
                    },
                    relations: ['user', 'transactions'],
                    withDeleted: true,
                })
            }

            if (filter === 'active') {
                return walletsWithFilter(true)
            } else if (filter === 'closed') {
                return walletsWithFilter(false)
            } else if (!filter) {
                return await this.walletRepository.find({
                    relations: ['user', 'transactions'],
                    withDeleted: true,
                })
            } else {
                throw new HttpException(
                    'Your filter is not found',
                    HttpStatus.NOT_FOUND,
                )
            }
        } catch (error) {
            console.log(`Server error(WalletService: findAll): ${error}`)

            throw error
        }
    }

    // MUTATION

    async create(id: number): Promise<WalletEntity> {
        try {
            const user = await this.userService.findOne(id)

            if (!user) {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND)
            }

            return this.walletRepository.save({ user })
        } catch (error) {
            console.log(`Server error(WalletService: create): ${error}`)

            throw error
        }
    }

    /* 
        При удаление пользователя не стал перекидывать все на один кошелек, т.к. все они в любом случае будут заморожены
    */
    async close(closeWallet: IClose): Promise<String> {
        try {
            const queryRunner = this.connection.createQueryRunner()

            await queryRunner.connect()

            const { userId, walletId } = closeWallet

            const user = await this.userService.findOne(userId)

            if (!user) {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND)
            }

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

            const wallets = user.wallets
                .filter((wallet) => wallet.status !== false)
                .filter((wallet) => wallet.id !== Number(walletId))

            if (wallets.length === 0) {
                await this.walletRepository.update(walletId, {
                    status: false,
                    closed_at: new Date(),
                })
            } else {
                const closedWalletBalance = wallet.balance

                const activeWallet = wallets.pop()

                const activeWalletBalance =
                    closedWalletBalance + Number(activeWallet?.balance)

                await queryRunner.startTransaction()

                try {
                    await queryRunner.manager.update(
                        WalletEntity,
                        activeWallet?.id,
                        {
                            balance: activeWalletBalance,
                        },
                    )

                    await queryRunner.manager.update(WalletEntity, walletId, {
                        status: false,
                        closed_at: new Date(),
                        balance: 0,
                    })

                    await queryRunner.manager.save(TransactionEntity, {
                        operation: 'transfer',
                        sum: closedWalletBalance,
                        wallet: wallet,
                        from: wallet.id,
                        to: activeWallet?.id,
                    })

                    await queryRunner.manager.save(TransactionEntity, {
                        operation: 'receipt',
                        sum: closedWalletBalance,
                        wallet: activeWallet,
                        from: wallet.id,
                        to: activeWallet?.id,
                    })

                    await queryRunner.commitTransaction()
                } catch (error) {
                    await queryRunner.rollbackTransaction()

                    console.log(`Close wallet error: ${error}`)

                    throw error
                } finally {
                    await queryRunner.release()
                }
            }

            return 'Account closed'
        } catch (error) {
            console.log(`Server error(WalletService: close): ${error}`)

            throw error
        }
    }

    async deposit(depositWallet: IDeposit): Promise<Number> {
        try {
            const { walletId, userId, sum } = depositWallet

            const user = await this.userService.findOne(userId)

            if (!user) {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND)
            }

            const wallet = await this.findOne(walletId, userId)

            if (!wallet) {
                throw new HttpException(
                    'Wallet not found',
                    HttpStatus.NOT_FOUND,
                )
            }

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

    async withdraw(withdrawWallet: IWithdraw): Promise<Number> {
        try {
            const { userId, walletId, sum } = withdrawWallet

            const user = await this.userService.findOne(userId)

            if (!user) {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND)
            }

            const wallet = await this.findOne(walletId, userId)

            if (!wallet) {
                throw new HttpException(
                    'Wallet not found',
                    HttpStatus.NOT_FOUND,
                )
            }

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
    async transfer(transferWallet: ITransfer): Promise<Number> {
        try {
            const { from, to, sum } = transferWallet

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
