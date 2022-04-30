import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateTransactionDto } from '../dtos/create-transaction.dto'
import { TransactionEntity } from '../models/transaction.entity'

@Injectable()
export class TransactionService {
    logger: Logger

    constructor(
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
    ) {
        this.logger = new Logger(TransactionService.name)
    }

    // QUERY

    async findAll(): Promise<TransactionEntity[]> {
        try {
            return await this.transactionRepository.find({
                order: {
                    id: 'ASC',
                },
            })
        } catch (error) {
            this.logger.error(error)

            throw error
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
                throw new HttpException(
                    'Transaction not found',
                    HttpStatus.NOT_FOUND,
                )
            }

            return transaction
        } catch (error) {
            this.logger.error(error)

            throw error
        }
    }

    // MUTATION

    async create(createDto: CreateTransactionDto): Promise<TransactionEntity> {
        try {
            const { from, to, sum, operation, wallet_id } = createDto

            // if (operation) {
            //     throw new HttpException(
            //         'Transaction not found',
            //         HttpStatus.NOT_FOUND,
            //     )
            // }

            if (from && to) {
                this.logger.debug('CREATING A TRANSACTION RECORD')
                return await this.transactionRepository.save({
                    operation,
                    sum,
                    wallet_id,
                    from,
                    to,
                })
            } else {
                this.logger.debug('CREATING A TRANSACTION RECORD')
                return await this.transactionRepository.save({
                    operation,
                    sum,
                    wallet_id,
                })
            }
        } catch (error) {
            this.logger.error(error)

            throw error
        }
    }
}
