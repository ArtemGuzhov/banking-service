import { Injectable, Logger } from '@nestjs/common'
import { RpcException } from '@nestjs/microservices'
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
        private readonly transactionRepository: Repository<TransactionEntity>,
    ) {}

    // QUERY

    async findAll(
        findAllDto: FindAllTransactionsDto,
    ): Promise<TransactionEntity[]> {
        try {
            const { id } = findAllDto

            const transactions = id
                ? await this.transactionRepository.find({
                      where: {
                          wallet_id: id,
                      },
                      order: {
                          id: 'ASC',
                      },
                  })
                : await this.transactionRepository.find({
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
            const transaction = await this.transactionRepository.findOne({
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

    async create(createDto: CreateTransactionDto): Promise<TransactionEntity> {
        try {
            const { from, to, sum, operation, wallet_id } = createDto

            if (from && to) {
                return await this.transactionRepository.save({
                    operation,
                    sum,
                    wallet_id,
                    from,
                    to,
                })
            } else {
                return await this.transactionRepository.save({
                    operation,
                    sum,
                    wallet_id,
                })
            }
        } catch (error) {
            this._logger.error(error, error.stack)

            throw new RpcException(error)
        }
    }
}
