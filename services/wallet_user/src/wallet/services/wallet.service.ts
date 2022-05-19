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
import { UpdateStatusDto } from '../dtos/update-status.dto'
import { UpdateTwoBalanceDto } from '../dtos/update-two-balance.dto'

const TRANSACTION = 'TRANSACTION'
const WALLET_USER = 'WALLET_USER'

const OPERATIONS = { DEPOSIT: 'deposit', WITHDRAW: 'withdraw' }
const STATUSES = { DEFAULT: 0, SUCCESS: 1, ERROR: 2 }

@Injectable()
export class WalletService {
    private readonly _logger = new Logger(WalletService.name)
    private _statusMsTransaction: number = STATUSES.DEFAULT
    private _statusMsWalletUser: number = STATUSES.DEFAULT
    private _statusUpdateBalance: number = STATUSES.DEFAULT
    // private _additionalStatus: number = STATUSES.DEFAULT

    constructor(
        @InjectRepository(WalletEntity)
        private readonly _walletRepository: Repository<WalletEntity>,
        private readonly _userService: UserService,
        private readonly _connection: Connection,
        private readonly _transactionService: TransactionService,
    ) {}

    async sleepForUpdateBalance(seconds: number) {
        await new Promise((res) => setTimeout(res, seconds * 1000))

        if (this._statusUpdateBalance === STATUSES.DEFAULT) {
            this._logger.debug('Waiting response from coordinator...')

            await this.sleepForUpdateBalance(1)
        }
    }

    async sleepForCoordinator(seconds: number) {
        await new Promise((res) => setTimeout(res, seconds * 1000))

        if (
            this._statusMsTransaction === STATUSES.DEFAULT ||
            this._statusMsWalletUser === STATUSES.DEFAULT
        ) {
            this._logger.debug('Waiting responses from microservices...')

            await this.sleepForCoordinator(1)
        }
    }

    updateMicroservicesStatus(updateStatusDto: UpdateStatusDto) {
        const { microservice, status } = updateStatusDto

        if (microservice === TRANSACTION) {
            this._statusMsTransaction = status
        } else if (microservice === WALLET_USER) {
            this._statusMsWalletUser = status
        }
    }

    async updateBalance(updateBalanceDto: UpdateBalanceDto) {
        try {
            this._logger.debug('Start operation update balance')

            const { wallet_id, operation, sum } = updateBalanceDto

            const queryRunner = this._connection.createQueryRunner()

            await queryRunner.connect()

            await queryRunner.startTransaction('REPEATABLE READ')

            try {
                const wallet = await queryRunner.manager.findOne(
                    WalletEntity,
                    wallet_id,
                )

                if (!wallet) {
                    throw new HttpException(
                        'Wallet not found',
                        HttpStatus.NOT_FOUND,
                    )
                }

                switch (operation) {
                    case OPERATIONS.DEPOSIT:
                        await queryRunner.manager.update(
                            WalletEntity,
                            wallet_id,
                            { incoming: wallet.incoming + sum },
                        )

                        break
                    case OPERATIONS.WITHDRAW:
                        await queryRunner.manager.update(
                            WalletEntity,
                            wallet_id,
                            { outgoing: wallet.outgoing + sum },
                        )

                        break
                    default:
                        break
                }

                this.updateMicroservicesStatus({
                    microservice: WALLET_USER,
                    status: STATUSES.SUCCESS,
                })

                await this.sleepForUpdateBalance(1)

                switch (this._statusUpdateBalance) {
                    case STATUSES.SUCCESS:
                        this._logger.log('COMMIT WALLET_USER')

                        await queryRunner.commitTransaction()

                        break
                    case STATUSES.ERROR:
                        throw 'Update balance transaction error'
                    default:
                        break
                }
            } catch (error) {
                await queryRunner.rollbackTransaction()

                this._statusMsWalletUser = STATUSES.ERROR

                throw new HttpException(error, HttpStatus.CONFLICT)
            } finally {
                this._statusUpdateBalance = STATUSES.DEFAULT

                await queryRunner.release()
            }
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    async updateTwoBalance(updateBalanceDto: UpdateTwoBalanceDto) {
        try {
            this._logger.debug('Start operation update two balance')

            const walletFirstData = updateBalanceDto.updateData[0]
            const walletSecondData = updateBalanceDto.updateData[1]

            const queryRunner = this._connection.createQueryRunner()

            await queryRunner.connect()

            await queryRunner.startTransaction('READ UNCOMMITTED')

            try {
                this.updateBalance(walletFirstData)
                this.updateBalance(walletSecondData)
            } catch (error) {
                await queryRunner.rollbackTransaction()

                this._statusMsWalletUser = STATUSES.ERROR

                throw new HttpException(error, HttpStatus.CONFLICT)
            } finally {
                this._statusUpdateBalance = STATUSES.DEFAULT

                await queryRunner.release()
            }
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    // QUERY

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

<<<<<<< Updated upstream
    async deposit(depositDto: DepositWalletDto): Promise<Number> {
=======
    async deposit(depositDto: DepositWalletDto): Promise<String> {
>>>>>>> Stashed changes
        try {
            this._logger.debug('START DEPOSIT OPERATION')

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

                const incoming = wallet.incoming + Number(sum)

                await queryRunner.manager.update(WalletEntity, walletId, {
                    incoming,
                })

                const transaction = await this._transactionService.create({
                    operation: 'deposit',
                    sum,
                    wallet_id: walletId,
                })

                await this.sleepForCoordinator(1)

                switch (true) {
                    case this._statusMsTransaction === STATUSES.SUCCESS &&
                        this._statusMsWalletUser === STATUSES.SUCCESS:
                        this._logger.log('ALL COMMIT')

                        this._transactionService.sendActionCommit(
                            STATUSES.SUCCESS,
                        )
                        this._statusUpdateBalance = STATUSES.SUCCESS

                        break
                    case this._statusMsTransaction === STATUSES.ERROR ||
                        this._statusMsWalletUser === STATUSES.ERROR:
                        this._transactionService.sendActionCommit(
                            STATUSES.ERROR,
                        )
                        this._statusUpdateBalance = STATUSES.ERROR

                        throw 'Total transaction error'
                    default:
                        break
                }

                return transaction.id
            } catch (error) {
                this._logger.error('ROLLBACK ALL')

                await queryRunner.rollbackTransaction()

                throw new HttpException(error, HttpStatus.CONFLICT)
            } finally {
                this._statusMsTransaction = STATUSES.DEFAULT
                this._statusMsWalletUser = STATUSES.DEFAULT

                await queryRunner.release()
            }
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    async withdraw(withdrawDto: WithdrawWalletDto): Promise<Number> {
        try {
            this._logger.debug('START WITHDRAW OPERATION')

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

                const outgoing = wallet.outgoing + Number(sum)

                await queryRunner.manager.update(WalletEntity, walletId, {
                    outgoing,
                })

                const transaction = await this._transactionService.create({
                    operation: 'withdraw',
                    sum,
                    wallet_id: walletId,
                })

                await this.sleepForCoordinator(1)

                switch (true) {
                    case this._statusMsTransaction === STATUSES.SUCCESS &&
                        this._statusMsWalletUser === STATUSES.SUCCESS:
                        this._logger.log('ALL COMMIT')

                        this._transactionService.sendActionCommit(
                            STATUSES.SUCCESS,
                        )
                        this._statusUpdateBalance = STATUSES.SUCCESS

                        break
                    case this._statusMsTransaction === STATUSES.ERROR ||
                        this._statusMsWalletUser === STATUSES.ERROR:
                        this._transactionService.sendActionCommit(
                            STATUSES.ERROR,
                        )
                        this._statusUpdateBalance = STATUSES.ERROR

                        throw 'Total transaction error'
                    default:
                        break
                }

                return transaction.id
            } catch (error) {
                this._logger.error('ROLLBACK ALL')

                await queryRunner.rollbackTransaction()

                throw new HttpException(error, HttpStatus.CONFLICT)
            } finally {
                this._statusMsTransaction = STATUSES.DEFAULT
                this._statusMsWalletUser = STATUSES.DEFAULT

                await queryRunner.release()
            }
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    async transfer(transferDto: TransferWalletDto): Promise<Number> {
        try {
            this._logger.debug('START TRANSFER OPERATION')

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

<<<<<<< Updated upstream
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

                const senderTransaction = await this._transactionService.create(
=======
                await this._transactionService.createTwoTransaction([
>>>>>>> Stashed changes
                    {
                        operation: 'transfer',
                        sum,
                        wallet_id: senderWallet.id,
                        from,
                        to,
<<<<<<< Updated upstream
                    },
                )

                await this._transactionService.create({
                    operation: 'transfer',
                    sum,
                    wallet_id: recipientWallet.id,
                    from,
                    to,
                })
=======
                        operation_for_update: 'withdraw',
                    },
                    {
                        operation: 'transfer',
                        sum,
                        wallet_id: recipientWallet.id,
                        from,
                        to,
                        operation_for_update: 'deposit',
                    },
                ])

                await this.sleepForCoordinator(1)
>>>>>>> Stashed changes

                switch (true) {
                    case this._statusMsTransaction === STATUSES.SUCCESS &&
                        this._statusMsWalletUser === STATUSES.SUCCESS:
                        this._logger.log('ALL COMMIT')

                        this._transactionService.sendActionCommit(
                            STATUSES.SUCCESS,
                        )
                        this._statusUpdateBalance = STATUSES.SUCCESS

                        break
                    case this._statusMsTransaction === STATUSES.ERROR ||
                        this._statusMsWalletUser === STATUSES.ERROR:
                        this._transactionService.sendActionCommit(
                            STATUSES.ERROR,
                        )
                        this._statusUpdateBalance = STATUSES.ERROR

                        throw 'Total transaction error'
                    default:
                        break
                }

                return senderTransaction.id
            } catch (error) {
                this._logger.error('ROLLBACK ALL')

                await queryRunner.rollbackTransaction()

                throw new HttpException(error, HttpStatus.FORBIDDEN)
            } finally {
                this._statusMsTransaction = STATUSES.DEFAULT
                this._statusMsWalletUser = STATUSES.DEFAULT

                await queryRunner.release()
            }
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }
}
