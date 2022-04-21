import { Args, Resolver, Query } from '@nestjs/graphql'
import { TransactionService } from 'src/transaction/services/transaction.service'
import { Transaction } from '../models/transaction.interface'

@Resolver('transaction')
export class TransactionResolver {
    constructor(private readonly transactionService: TransactionService) {}

    // QUERY

    @Query(() => [Transaction], {
        name: 'transactions',
        description: 'Get all transactions.',
    })
    async transactions(
        @Args('filter', {
            nullable: true,
            description:
                "Filters: ['deposit', 'withdraw', 'transfer', 'receipt'].",
        })
        filter?: string,
    ): Promise<Transaction[]> {
        return await this.transactionService.findAll(filter)
    }

    @Query(() => Transaction, {
        name: 'transaction',
        description: 'Receiving a transaction by id.',
    })
    async transaction(
        @Args('id', { description: 'transaction id' }) id: number,
    ): Promise<Transaction> {
        return await this.transactionService.findOne(id)
    }
}
