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

const STATUSES = { DEFAULT: 0, SUCCESS: 1, ERROR: 2 }

@Injectable()
export class WalletService {
    private readonly _logger = new Logger(WalletService.name)
    private _statusTransactionMicroservice = STATUSES.DEFAULT

    constructor(
        @InjectRepository(WalletEntity)
        private readonly _walletRepository: Repository<WalletEntity>,
        private readonly _userService: UserService,
        private readonly _connection: Connection,
        private readonly _transactionService: TransactionService,
    ) {}

    // QUERY

    changeStatus(status: number) {
        this._statusTransactionMicroservice = status
    }

    async waiting() {
        await new Promise((res) => setTimeout(res, 1000))

        if (this._statusTransactionMicroservice === STATUSES.DEFAULT) {
            this._logger.debug(
                'Waiting response from transaction microservice...',
            )

            await this.waiting()
        }
    }

    async findOne(id: number, userId?: number): Promise<WalletEntity> {
        try {
            const wallet = await this._walletRepository.findOne(
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
                throw new HttpException(
                    'Wallet not found',
                    HttpStatus.NOT_FOUND,
                )
            }

            return wallet
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    async findAll(): Promise<WalletEntity[]> {
        try {
            return await this._walletRepository.find({
                relations: ['user'],
                order: {
                    id: 'ASC',
                },
            })
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    // MUTATION

    async create(id: number): Promise<WalletEntity> {
        try {
            const user = await this._userService.findOne(id)

            return this._walletRepository.save({ user })
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    async close(closeDto: CloseWalletDto): Promise<String> {
        try {
            const { userId, walletId } = closeDto

            const user = await this._userService.findOne(userId)

            const wallet = await this.findOne(walletId, userId)

            const wallets = user.wallets.filter((wallet) => wallet.status)

            if (!wallet.status) {
                throw new HttpException(
                    'Account already closed',
                    HttpStatus.FORBIDDEN,
                )
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

            await this._walletRepository.update(walletId, {
                status: false,
                closed_at: new Date(),
            })

            return 'Account closed'
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    async deposit(depositDto: DepositWalletDto): Promise<String> {
        try {
            this._logger.debug('--------------------')
            this._logger.log('START OPERATION DEPOSIT')

            const { walletId, userId, sum } = depositDto

            await this._userService.findOne(userId)

            const queryRunner = this._connection.createQueryRunner()

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
                    throw new HttpException(
                        'Wallet not found',
                        HttpStatus.NOT_FOUND,
                    )
                }

                if (!wallet.status) {
                    throw new HttpException(
                        'Account closed',
                        HttpStatus.FORBIDDEN,
                    )
                }

                await queryRunner.manager.update(WalletEntity, walletId, {
                    incoming: wallet.incoming + sum,
                })

                await this._transactionService.create({
                    operation: 'deposit',
                    sum,
                    wallet_id: walletId,
                })

                await this.waiting()

                switch (this._statusTransactionMicroservice) {
                    case STATUSES.SUCCESS:
                        this._transactionService.sendStatusTransaction(
                            STATUSES.SUCCESS,
                        )

                        this._logger.log('COMMIT DEPOSIT')
                        this._logger.debug('--------------------')

                        await queryRunner.commitTransaction()

                        break

                    case STATUSES.ERROR:
                        throw 'Operation deposit error'

                    default:
                        break
                }

                return 'Expect'
            } catch (error) {
                this._transactionService.sendStatusTransaction(STATUSES.ERROR)

                this._logger.error('ROLLBACK DEPOSIT')

                await queryRunner.rollbackTransaction()

                throw new HttpException(error, HttpStatus.CONFLICT)
            } finally {
                await queryRunner.release()

                this._statusTransactionMicroservice = STATUSES.DEFAULT
            }
        } catch (error) {
            this._logger.error(error, error.stack)
            this._logger.debug('--------------------')

            throw error
        }
    }

    async withdraw(withdrawDto: WithdrawWalletDto): Promise<String> {
        try {
            this._logger.debug('--------------------')
            this._logger.log('START OPERATION WITHDRAW')

            const { userId, walletId, sum } = withdrawDto

            await this._userService.findOne(userId)

            const queryRunner = this._connection.createQueryRunner()

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
                    throw new HttpException(
                        'Wallet not found',
                        HttpStatus.NOT_FOUND,
                    )
                }

                if (!wallet.status) {
                    throw new HttpException(
                        'Account closed',
                        HttpStatus.FORBIDDEN,
                    )
                }

                const currentBalance = wallet.incoming - wallet.outgoing

                if (currentBalance < sum) {
                    throw new HttpException(
                        'Insufficient funds',
                        HttpStatus.FORBIDDEN,
                    )
                }

                await queryRunner.manager.update(WalletEntity, walletId, {
                    outgoing: wallet.outgoing + sum,
                })

                await this._transactionService.create({
                    operation: 'withdraw',
                    sum,
                    wallet_id: walletId,
                })

                await this.waiting()

                switch (this._statusTransactionMicroservice) {
                    case STATUSES.SUCCESS:
                        this._transactionService.sendStatusTransaction(
                            STATUSES.SUCCESS,
                        )

                        this._logger.log('COMMIT WITHDRAW')
                        this._logger.debug('--------------------')

                        await queryRunner.commitTransaction()

                        break

                    case STATUSES.ERROR:
                        throw 'Operation withdraw error'

                    default:
                        break
                }

                return 'Expect'
            } catch (error) {
                this._transactionService.sendStatusTransaction(STATUSES.ERROR)

                this._logger.error('ROLLBACK DEPOSIT')
                await queryRunner.rollbackTransaction()

                throw new HttpException(error, HttpStatus.CONFLICT)
            } finally {
                this._statusTransactionMicroservice = STATUSES.DEFAULT
                await queryRunner.release()
            }
        } catch (error) {
            this._logger.error(error, error.stack)
            this._logger.debug('--------------------')

            throw error
        }
    }

    async transfer(transferDto: TransferWalletDto): Promise<String> {
        try {
            this._logger.debug('--------------------')
            this._logger.log('START OPERATION TRANSFER')
            const { from, to, sum } = transferDto

            if (from === to) {
                throw new HttpException(
                    'You can not transfer for the same wallets',
                    HttpStatus.FORBIDDEN,
                )
            }

            const queryRunner = this._connection.createQueryRunner()

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

                const recipient = await queryRunner.manager.findOne(
                    UserEntity,
                    {
                        where: {
                            id: recipientWallet.user.id,
                        },
                    },
                )

                if (!recipient) {
                    throw new HttpException(
                        'Recipient wallet user not found',
                        HttpStatus.NOT_FOUND,
                    )
                }

                const currentSenderBalance =
                    senderWallet.incoming - senderWallet.outgoing

                if (currentSenderBalance < sum) {
                    throw new HttpException(
                        'Insufficient funds',
                        HttpStatus.FORBIDDEN,
                    )
                }

                await queryRunner.manager.update(
                    WalletEntity,
                    senderWallet.id,
                    {
                        outgoing: senderWallet.outgoing + sum,
                    },
                )

                await queryRunner.manager.update(
                    WalletEntity,
                    recipientWallet.id,
                    {
                        incoming: recipientWallet.incoming + sum,
                    },
                )

                await this._transactionService.createTwoTransaction([
                    {
                        operation: 'transfer',
                        sum,
                        wallet_id: senderWallet.id,
                        from,
                        to,
                    },
                    {
                        operation: 'transfer',
                        sum,
                        wallet_id: recipientWallet.id,
                        from,
                        to,
                    },
                ])

                await this.waiting()

                switch (this._statusTransactionMicroservice) {
                    case STATUSES.SUCCESS:
                        this._transactionService.sendStatusTransaction(
                            STATUSES.SUCCESS,
                        )

                        this._logger.log('COMMIT TRANSFER')
                        this._logger.debug('--------------------')

                        await queryRunner.commitTransaction()

                        break

                    case STATUSES.ERROR:
                        throw 'Operation transfer error'

                    default:
                        break
                }

                return 'Expect'
            } catch (error) {
                this._transactionService.sendStatusTransaction(STATUSES.ERROR)

                this._logger.error('ROLLBACK TRANSFER')

                await queryRunner.rollbackTransaction()

                throw new HttpException(error, HttpStatus.FORBIDDEN)
            } finally {
                this._statusTransactionMicroservice = STATUSES.DEFAULT

                await queryRunner.release()
            }
        } catch (error) {
            this._logger.error(error, error.stack)
            this._logger.debug('--------------------')

            throw error
        }
    }
}
