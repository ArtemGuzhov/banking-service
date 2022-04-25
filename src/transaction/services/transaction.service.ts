import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateTransactionDto } from '../dtos/create-transaction.dto'
import { TransactionEntity } from '../models/transaction.entity'

@Injectable()
export class TransactionService {
    constructor(
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
    ) {}

    // QUERY

    async findAll(): Promise<TransactionEntity[]> {
        try {
            return await this.transactionRepository.find({
                relations: ['wallet', 'wallet.user'],
            })
        } catch (error) {
            console.log(`Server error(TransactionService: findAll): ${error}`)

            throw error
        }
    }

    async findOne(id: number): Promise<TransactionEntity> {
        try {
            const transaction = await this.transactionRepository.findOne({
                where: {
                    id,
                },
                relations: ['wallet', 'wallet.user'],
            })

            if (!transaction) {
                throw new HttpException(
                    'Transaction not found',
                    HttpStatus.NOT_FOUND,
                )
            }

            return transaction
        } catch (error) {
            console.log(`Server error(TransactionService: findOne): ${error}`)

            throw error
        }
    }

    // MUTATION

    async create(createDto: CreateTransactionDto): Promise<TransactionEntity> {
        try {
            const { from, to, sum, operation, wallet } = createDto

            if (from && to) {
                return await this.transactionRepository.save({
                    operation,
                    sum,
                    wallet,
                    from,
                    to,
                })
            } else {
                return await this.transactionRepository.save({
                    operation,
                    sum,
                    wallet,
                })
            }
        } catch (error) {
            console.log(`Server error(TransactionService: create): ${error}`)

            throw error
        }
    }
}
