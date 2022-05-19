import {
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common'
import { ClientProxy, RpcException } from '@nestjs/microservices'
import { InjectRepository } from '@nestjs/typeorm'
import { Connection, Repository } from 'typeorm'
import { CreateTransactionDto } from '../dtos/create-transaction.dto'
import { FindAllTransactionsDto } from '../dtos/find-all-transactions'
import { TransactionEntity } from '../models/transaction.entity'

const STATUSES = { DEFAULT: 0, SUCCESS: 1, ERROR: 2 }

@Injectable()
export class TransactionService {
    private readonly _logger = new Logger(TransactionService.name)
    private _statusWalletUserMicroservice = STATUSES.DEFAULT

    constructor(
        @InjectRepository(TransactionEntity)
        private readonly _transactionRepository: Repository<TransactionEntity>,
        @Inject('rabbit-mq-module') private readonly _client: ClientProxy,
        private readonly _connection: Connection,
    ) {}

    async changeStatus(status: number) {
        this._statusWalletUserMicroservice = status
    }

    async waiting() {
        await new Promise((res) => setTimeout(res, 1000))

        if (this._statusWalletUserMicroservice === STATUSES.DEFAULT) {
            this._logger.debug(
                'Waiting response from wallet_user microservice...',
            )

            await this.waiting()
        }
    }

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

            throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
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
                throw new HttpException(
                    'Transaction not found',
                    HttpStatus.NOT_FOUND,
                )
            }

            return transaction
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    // MUTATION

    async create(createDto: CreateTransactionDto) {
        try {
            this._logger.debug('--------------------')
            this._logger.log('START OPERATION CREATE TRANSACTION')

            const queryRunner = this._connection.createQueryRunner()

            await queryRunner.connect()

            await queryRunner.startTransaction('SERIALIZABLE')

            try {
                await queryRunner.manager.save(TransactionEntity, {
                    ...createDto,
                })

                this._client.emit('response-to-wallet-user', {
                    status: STATUSES.SUCCESS,
                })

                this._logger.debug(
                    'Send data in rabbitmq for change status transaction microservice',
                )

                await this.waiting()

                switch (this._statusWalletUserMicroservice) {
                    case STATUSES.SUCCESS:
                        this._logger.log('COMMIT TRANSACTION CREATE')
                        this._logger.debug('--------------------')

                        await queryRunner.commitTransaction()

                        break

                    case STATUSES.ERROR:
                        throw 'Operation create transaction error'

                    default:
                        break
                }
            } catch (error) {
                this._logger.error('ROLLBACK TRANSACTION CREATE')

                await queryRunner.rollbackTransaction()

                this._client.emit('response-to-wallet-user', {
                    status: STATUSES.ERROR,
                })

                throw new RpcException('Create transaction error')
            } finally {
                await queryRunner.release()

                this._statusWalletUserMicroservice = STATUSES.DEFAULT
            }
        } catch (error) {
            this._logger.error(error, error.stack)
            this._logger.debug('--------------------')

            throw new RpcException(error)
        }
    }

    async createTwo(createDto: CreateTransactionDto[]) {
        try {
            this._logger.debug('--------------------')
            this._logger.log('START OPERATION CREATE TWO TRANSACTIONS')

            const queryRunner = this._connection.createQueryRunner()

            await queryRunner.connect()

            await queryRunner.startTransaction('SERIALIZABLE')

            try {
                createDto.forEach(
                    async (data) =>
                        await queryRunner.manager.save(TransactionEntity, {
                            ...data,
                        }),
                )

                this._client.emit('response-to-wallet-user', {
                    status: STATUSES.SUCCESS,
                })

                this._logger.debug(
                    'Send data in rabbitmq for change status transaction microservice',
                )

                await this.waiting()

                switch (this._statusWalletUserMicroservice) {
                    case STATUSES.SUCCESS:
                        this._logger.log('COMMIT TRANSACTION CREATE TWO')
                        this._logger.debug('--------------------')

                        await queryRunner.commitTransaction()

                        break

                    case STATUSES.ERROR:
                        throw 'Operation create transaction error'

                    default:
                        break
                }
            } catch (error) {
                this._logger.error('ROLLBACK TRANSACTION CREATE TWO')

                await queryRunner.rollbackTransaction()

                this._client.emit('response-to-wallet-user', {
                    status: STATUSES.ERROR,
                })

                throw new RpcException('Create transaction error')
            } finally {
                await queryRunner.release()

                this._statusWalletUserMicroservice = STATUSES.DEFAULT
            }
        } catch (error) {
            this._logger.error(error, error.stack)
            this._logger.debug('--------------------')

            throw new RpcException(error)
        }
    }
}
