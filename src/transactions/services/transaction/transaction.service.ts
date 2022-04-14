import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { TransactionEntity } from 'src/entities/transaction.entity'
import { Repository } from 'typeorm'

@Injectable()
export class TransactionService {
    constructor(
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
    ) {}

    /* 
        Так как транзакции по отдельному кошельку можно вытащить через 
        "getOneWallet(id: number)", то здесь вытаскиваются все транзакции по всем кошелькам
    */
    async getTransactions(): Promise<TransactionEntity[]> {
        return await this.transactionRepository.find()
    }

    async getOneTransaction(id: number): Promise<TransactionEntity> {
        const transaction = await this.transactionRepository.findOne({ id })

        if (!transaction) {
            throw new HttpException(
                'Transaction not found',
                HttpStatus.NOT_FOUND,
            )
        }

        return transaction
    }
}
