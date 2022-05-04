import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
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
    logger: Logger

    constructor(
        @InjectRepository(WalletEntity)
        private readonly walletRepository: Repository<WalletEntity>,
        private readonly userService: UserService,
        private connection: Connection,
        private readonly transactionService: TransactionService,
    ) {
        this.logger = new Logger(WalletService.name)
    }

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
                          relations: ['user'],
                      }
                    : {
                          where: {
                              id,
                          },

                          relations: ['user'],
                      },
            )

            if (!wallet) {
                throw {
                    message: 'Wallet not found',
                    status: HttpStatus.NOT_FOUND,
                }
            }

            return wallet
        } catch (error) {
            this.logger.error(error)

            throw new HttpException(error.message, error.status)
        }
    }

    async findAll(): Promise<WalletEntity[]> {
        try {
            return await this.walletRepository.find({
                relations: ['user'],
                order: {
                    id: 'ASC',
                },
            })
        } catch (error) {
            this.logger.error(error)

            throw new HttpException(error.message, error.status)
        }
    }

    // MUTATION

    async create(id: number): Promise<WalletEntity> {
        try {
            const user = await this.userService.findOne(id)

            return this.walletRepository.save({ user })
        } catch (error) {
            this.logger.error(error)

            throw new HttpException(error.message, error.status)
        }
    }

    async close(closeDto: CloseWalletDto): Promise<String> {
        try {
            const { userId, walletId } = closeDto

            const user = await this.userService.findOne(userId)

            const wallet = await this.findOne(walletId, userId)

            const wallets = user.wallets.filter((wallet) => wallet.status)

            if (!wallet.status) {
                throw {
                    message: 'Account already closed',
                    status: HttpStatus.FORBIDDEN,
                }
            }

            if (wallets.length > 1) {
                const depositedWalletId = wallets.filter(
                    (wallet) => wallet.id !== Number(walletId),
                )[0]!['id']

                await this.transfer({
                    from: walletId,
                    to: depositedWalletId,
                    sum: wallet.balance,
                })
            }

            await this.walletRepository.update(walletId, {
                status: false,
                closed_at: new Date(),
            })

            return 'Account closed'
        } catch (error) {
            this.logger.error(error)

            throw new HttpException(error.message, error.status)
        }
    }

    async deposit(depositDto: DepositWalletDto): Promise<Number> {
        try {
            const { walletId, userId, sum } = depositDto

            await this.userService.findOne(userId)

            const queryRunner = this.connection.createQueryRunner()

            await queryRunner.connect()

            await queryRunner.startTransaction('SERIALIZABLE')

            try {
                const wallet = await queryRunner.manager.findOne(WalletEntity, {
                    where: {
                        id: walletId,
                        user: {
                            id: userId,
                        },
                    },
                })

                if (!wallet) {
                    throw {
                        message: 'Wallet not found',
                        status: HttpStatus.NOT_FOUND,
                    }
                }

                if (!wallet.status) {
                    throw {
                        message: 'Account closed',
                        status: HttpStatus.FORBIDDEN,
                    }
                }

                const transaction = await this.transactionService.create({
                    operation: 'deposit',
                    sum,
                    wallet_id: walletId,
                })

                const incoming = wallet.incoming + Number(sum)

                await queryRunner.manager.update(WalletEntity, walletId, {
                    incoming,
                })

                await queryRunner.commitTransaction()

                return transaction.id
            } catch (error) {
                await queryRunner.rollbackTransaction()

                throw {
                    message: 'Error when making a deposit',
                    status: HttpStatus.CONFLICT,
                }
            } finally {
                await queryRunner.release()
            }
        } catch (error) {
            this.logger.error(error)

            throw new HttpException(error.message, error.status)
        }
    }

    async withdraw(withdrawDto: WithdrawWalletDto): Promise<Number> {
        try {
            const { userId, walletId, sum } = withdrawDto

            await this.userService.findOne(userId)

            const queryRunner = this.connection.createQueryRunner()

            await queryRunner.connect()

            await queryRunner.startTransaction('SERIALIZABLE')

            try {
                const wallet = await queryRunner.manager.findOne(WalletEntity, {
                    where: {
                        id: walletId,
                        user: {
                            id: userId,
                        },
                    },
                })

                if (!wallet) {
                    throw {
                        message: 'Wallet not found',
                        status: HttpStatus.NOT_FOUND,
                    }
                }

                if (!wallet.status) {
                    throw {
                        message: 'Account closed',
                        status: HttpStatus.FORBIDDEN,
                    }
                }

                const currentBalance = wallet.incoming - wallet.outgoing

                if (currentBalance < sum) {
                    throw new HttpException(
                        'Insufficient funds',
                        HttpStatus.FORBIDDEN,
                    )
                }

                const outgoing = wallet.outgoing + Number(sum)

                await queryRunner.manager.update(WalletEntity, walletId, {
                    outgoing,
                })

                const transaction = await this.transactionService.create({
                    operation: 'deposit',
                    sum,
                    wallet_id: walletId,
                })

                await queryRunner.commitTransaction()

                return transaction.id
            } catch (error) {
                await queryRunner.rollbackTransaction()

                throw {
                    message: 'Withdrawal error',
                    status: HttpStatus.CONFLICT,
                }
            } finally {
                await queryRunner.release()
            }
        } catch (error) {
            this.logger.error(error)

            throw new HttpException(error.message, error.status)
        }
    }

    async transfer(transferDto: TransferWalletDto): Promise<Number> {
        try {
            const { from, to, sum } = transferDto

            if (from === to) {
                throw {
                    message: 'You can not transfer for the same wallets',
                    status: HttpStatus.FORBIDDEN,
                }
            }

            const queryRunner = this.connection.createQueryRunner()

            await queryRunner.connect()

            await queryRunner.startTransaction('REPEATABLE READ')

            try {
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
                    throw {
                        message: 'Sender`s wallet not found',
                        status: HttpStatus.NOT_FOUND,
                    }
                }

                if (!senderWallet.status) {
                    throw {
                        message: 'Sender`s wallet closed',
                        status: HttpStatus.FORBIDDEN,
                    }
                }

                const sender = await queryRunner.manager.findOne(UserEntity, {
                    where: {
                        id: senderWallet.user.id,
                    },
                })

                if (!sender) {
                    throw {
                        message: 'Sender wallet user not found',
                        status: HttpStatus.NOT_FOUND,
                    }
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
                    throw {
                        message: 'Recipient`s wallet not found',
                        status: HttpStatus.NOT_FOUND,
                    }
                }

                if (!recipientWallet.status) {
                    throw {
                        message: 'Recipient`s wallet closed',
                        status: HttpStatus.FORBIDDEN,
                    }
                }

                const recipient = await queryRunner.manager.findOne(
                    UserEntity,
                    {
                        where: {
                            id: recipientWallet.user.id,
                        },
                    },
                )

                if (!recipient) {
                    throw {
                        message: 'Recipient wallet user not found',
                        status: HttpStatus.NOT_FOUND,
                    }
                }

                const currentSenderBalance =
                    senderWallet.incoming - senderWallet.outgoing

                if (currentSenderBalance < sum) {
                    throw {
                        message: 'Insufficient funds',
                        status: HttpStatus.FORBIDDEN,
                    }
                }

                const moneyTransfer = {
                    outgoing: senderWallet.outgoing + sum,
                    incoming: recipientWallet.incoming + sum,
                }

                await queryRunner.manager.update(
                    WalletEntity,
                    senderWallet.id,
                    { outgoing: moneyTransfer.outgoing },
                )

                await queryRunner.manager.update(
                    WalletEntity,
                    recipientWallet.id,
                    { incoming: moneyTransfer.incoming },
                )

                const senderResult = await this.transactionService.create({
                    operation: 'transfer',
                    sum,
                    wallet_id: senderWallet.id,
                    from,
                    to,
                })

                await this.transactionService.create({
                    operation: 'transfer',
                    sum,
                    wallet_id: recipientWallet.id,
                    from,
                    to,
                })

                await queryRunner.commitTransaction()

                return senderResult.id
            } catch (error) {
                await queryRunner.rollbackTransaction()

                throw {
                    message: 'Withdrawal error',
                    status: HttpStatus.CONFLICT,
                }
            } finally {
                await queryRunner.release()
            }
        } catch (error) {
            this.logger.error(error)

            throw new HttpException(error.message, error.status)
        }
    }
}
