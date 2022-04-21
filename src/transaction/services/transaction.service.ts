import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ICreate } from '../interfaces/transaction-service.interface'
import { TransactionEntity } from '../models/transaction.entity'

@Injectable()
export class TransactionService {
    constructor(
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
    ) {}

    // QUERY

    async findAll(filter?: string): Promise<TransactionEntity[]> {
        try {
            const transactionsWithFilter = async (type: string) => {
                return await this.transactionRepository.find({
                    where: {
                        operation: type,
                    },
                    relations: ['wallet', 'wallet.user'],
                })
            }

            if (filter === 'deposit') {
                return transactionsWithFilter('deposit')
            } else if (filter === 'withdraw') {
                return transactionsWithFilter('withdraw')
            } else if (filter === 'transfer') {
                return transactionsWithFilter('transfer')
            } else if (filter === 'receipt') {
                return transactionsWithFilter('receipt')
            } else if (!filter) {
                return await this.transactionRepository.find({
                    relations: ['wallet', 'wallet.user'],
                })
            } else {
                throw new HttpException(
                    `Your filter is not found`,
                    HttpStatus.NOT_FOUND,
                )
            }
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

    async create(createTransaction: ICreate): Promise<TransactionEntity> {
        try {
            const { from, to, sum, operation, wallet } = createTransaction

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
