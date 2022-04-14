import { Args, Resolver, Query } from '@nestjs/graphql'
import { TransactionEntity } from 'src/entities/transaction.entity'
import { TransactionService } from 'src/transactions/services/transaction/transaction.service'

@Resolver('Transaction')
export class TransactionResolver {
    constructor(private readonly transactionService: TransactionService) {}

    // QUERY

    @Query(() => TransactionEntity)
    async getOneTransaction(
        @Args('id') id: number,
    ): Promise<TransactionEntity> {
        return await this.transactionService.getOneTransaction(id)
    }

    @Query(() => [TransactionEntity])
    async getTransactions(): Promise<TransactionEntity[]> {
        return await this.transactionService.getTransactions()
    }
}
