import { Inject, Injectable, Logger } from '@nestjs/common'
import { ClientProxy, RpcException } from '@nestjs/microservices'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateTransactionDto } from '../dtos/create-transaction.dto'
import { FindAllTransactionsDto } from '../dtos/find-all-transactions'
import { TransactionEntity } from '../models/transaction.entity'

@Injectable()
export class TransactionService {
    private readonly _logger = new Logger(TransactionService.name)

    constructor(
        @InjectRepository(TransactionEntity)
        private readonly _transactionRepository: Repository<TransactionEntity>,
        @Inject('rabbit-mq-module') private readonly _client: ClientProxy,
    ) {}

    async checoutResult() {
        this._client.emit('checkout-result', {})
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

            return transaction
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    // MUTATION

    async create(createDto: CreateTransactionDto) {
        try {
            this._logger.debug('Create Transaction')
            this._logger.debug({ ...createDto })

            await this._transactionRepository.save({
                ...createDto,
            })

            this._client.emit('producer-balance', {
                wallet_id: createDto.wallet_id,
                sum: createDto.sum,
                operation:
                    createDto.operation === 'transfer'
                        ? createDto.operation_for_update
                        : createDto.operation,
            })
        } catch (error) {
            this._logger.error(error, error.stack)

            throw new RpcException(error)
        }
    }
}
