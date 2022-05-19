import { Args, Query, Resolver } from '@nestjs/graphql'
import { Transaction } from '../graphql/type/transaction.type'
import { TransactionService } from '../services/transaction.service'

@Resolver()
export class TransactionResolver {
    constructor(private readonly _transactionService: TransactionService) {}

    // QUERY

    @Query(() => [Transaction], {
        name: 'transactions',
        description: 'Get all transactions.',
    })
    async transactions(
        @Args('id', { description: 'transaction id', nullable: true })
        id?: number,
    ) {
        return await this._transactionService.findAll({ id })
    }

    @Query(() => Transaction, {
        name: 'transaction',
        description: 'Receiving a transaction by id.',
    })
    async transaction(
        @Args('id', { description: 'transaction id' }) id: number,
    ) {
        return await this._transactionService.findOne(id)
    }
}
