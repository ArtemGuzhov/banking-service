import { Injectable, Logger } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
import { InjectRepository } from '@nestjs/typeorm'
import { Connection, Repository } from 'typeorm'
import { CreateTransactionDto } from '../dtos/create-transaction.dto'
import { CreateTwoTransactionDto } from '../dtos/create-two-transaction.dto'
import { FindAllTransactionsDto } from '../dtos/find-all-transactions'
import { TransactionEntity } from '../models/transaction.entity'

const STATUSES = { DEFAULT: 0, SUCCESS: 1, ERROR: 2 }

@Injectable()
export class TransactionService {
    private readonly _logger = new Logger(TransactionService.name)
    private _statusCreateTransaction: number = STATUSES.DEFAULT

    constructor(
        @InjectRepository(TransactionEntity)
        private readonly _transactionRepository: Repository<TransactionEntity>,
<<<<<<< Updated upstream
    ) {}

=======
        @Inject('rabbit-mq-module') private readonly _client: ClientProxy,
        private readonly _connection: Connection,
    ) {}

    updateStatus(status: number) {
        this._statusCreateTransaction = status
    }

    async sleepForCreateTransaction(seconds: number) {
        await new Promise((res) => setTimeout(res, seconds * 1000))

        if (this._statusCreateTransaction === STATUSES.DEFAULT) {
            this._logger.debug('Waiting response from coordinator...')

            await this.sleepForCreateTransaction(1)
        }
    }

>>>>>>> Stashed changes
    // QUERY

    async findAll(
        findAllDto: FindAllTransactionsDto,
    ): Promise<TransactionEntity[]> {
        try {
            const { id } = findAllDto

            const transactions = id
                ? await this._transactionRepository.find({
                      where: {
                          wallet_id: id,
                      },
                      order: {
                          id: 'ASC',
                      },
                  })
                : await this._transactionRepository.find({
                      order: {
                          id: 'ASC',
                      },
                  })

            return transactions
        } catch (error) {
            this._logger.error(error, error.stack)

            throw new RpcException(error)
        }
    }

    async findOne(id: number): Promise<TransactionEntity> {
        try {
            const transaction = await this._transactionRepository.findOne({
                where: {
                    id,
                },
            })

            if (!transaction) {
                throw new RpcException('Transaction not found')
            }

            this._logger.log({ ...transaction })

            return transaction
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    // MUTATION

    async create(createDto: CreateTransactionDto): Promise<TransactionEntity> {
        try {
<<<<<<< Updated upstream
            return await this._transactionRepository.save({
                ...createDto,
            })
=======
            this._logger.debug('Start operation create Transaction')

            const queryRunner = this._connection.createQueryRunner()

            await queryRunner.connect()

            await queryRunner.startTransaction('SERIALIZABLE')

            try {
                this._client.emit('producer-balance', {
                    wallet_id: createDto.wallet_id,
                    sum: createDto.sum,
                    operation:
                        createDto.operation === 'transfer'
                            ? createDto.operation_for_update
                            : createDto.operation,
                })

                await queryRunner.manager.save(TransactionEntity, {
                    ...createDto,
                })

                this._client.emit('producer-update-status', {
                    microservice: 'TRANSACTION',
                    status: STATUSES.SUCCESS,
                })

                await this.sleepForCreateTransaction(1)

                switch (this._statusCreateTransaction) {
                    case STATUSES.SUCCESS:
                        this._logger.log('COMMIT TRANSACTION')

                        await queryRunner.commitTransaction()

                        break
                    case STATUSES.ERROR:
                        throw 'Create transaction error'
                    default:
                        break
                }
            } catch {
                this._logger.error('ROLLBACK TRANSACTION')
                await queryRunner.rollbackTransaction()

                throw 'Create transaction error'
            } finally {
                this._statusCreateTransaction = STATUSES.DEFAULT

                await queryRunner.release()
            }
        } catch (error) {
            this._logger.error(error, error.stack)

            throw new RpcException(error)
        }
    }

    async createTwoTransactin(createDto: CreateTwoTransactionDto) {
        try {
            this._logger.debug('Start operation create two Transaction')

            const arrayTransaction = createDto.transactionData.map(
                (transaction) => {
                    const { wallet_id, sum, operation_for_update } = transaction

                    return {
                        wallet_id: wallet_id,
                        sum: sum,
                        operation: operation_for_update,
                    }
                },
            )

            const queryRunner = this._connection.createQueryRunner()

            await queryRunner.connect()

            await queryRunner.startTransaction('SERIALIZABLE')

            try {
                this._client.emit('producer-two-balance', {
                    updateData: [...arrayTransaction],
                })

                for (let i: number = 0; i < arrayTransaction.length; i++) {
                    await queryRunner.manager.save(TransactionEntity, {
                        ...createDto.transactionData[i],
                    })
                }

                this._logger.debug('VSE OK')

                this._client.emit('producer-update-status', {
                    microservice: 'TRANSACTION',
                    status: STATUSES.SUCCESS,
                })

                await this.sleepForCreateTransaction(1)

                switch (this._statusCreateTransaction) {
                    case STATUSES.SUCCESS:
                        this._logger.log('COMMIT TRANSACTION')

                        await queryRunner.commitTransaction()

                        break
                    case STATUSES.ERROR:
                        throw 'Create transaction error'
                    default:
                        break
                }
            } catch {
                this._logger.error('ROLLBACK TWO TRANSACTION')
                await queryRunner.rollbackTransaction()

                throw 'Create two transaction error'
            } finally {
                this._statusCreateTransaction = STATUSES.DEFAULT

                await queryRunner.release()
            }
>>>>>>> Stashed changes
        } catch (error) {
            this._logger.error(error, error.stack)

            throw new RpcException(error)
        }
    }
}
