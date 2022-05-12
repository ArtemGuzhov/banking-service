import { Args, Resolver, Query, ResolveField, Parent } from '@nestjs/graphql'
import { TransactionService } from 'src/transaction/services/transaction.service'
import { Wallet } from 'src/wallet/models/wallet.interface'
import { WalletService } from 'src/wallet/services/wallet.service'
import { Transaction } from '../models/transaction.interface'

@Resolver(() => Transaction)
export class TransactionResolver {
    constructor(
        private readonly transactionService: TransactionService,
        private readonly walletService: WalletService,
    ) {}

    // QUERY

    @Query(() => [Transaction], {
        name: 'transactions',
        description: 'Get all transactions.',
    })
    async transactions(): Promise<Transaction[]> {
        return await this.transactionService.findAll()
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

    @ResolveField(() => Wallet, {
        name: 'wallet',
        description: 'Allows you to get wallet information',
    })
    async wallet(@Parent() transaction: Transaction) {
        const { wallet_id } = transaction

        return this.walletService.findOne(wallet_id)
    }
}
