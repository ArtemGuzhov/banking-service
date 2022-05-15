import {
    Args,
    Resolver,
    Query,
    Mutation,
    ResolveField,
    Parent,
} from '@nestjs/graphql'
import { Transaction } from 'src/transaction/graphql/type/transaction.type'
import { TransactionService } from 'src/transaction/services/transaction.service'
import { WalletService } from 'src/wallet/services/wallet.service'
import { CloseWalletInput } from '../graphql/inputs/close-wallet.input'
import { DepositWalletInput } from '../graphql/inputs/deposit-wallet.input'
import { TransferWalletInput } from '../graphql/inputs/transfer-wallet.input'
import { WithdrawWalletInput } from '../graphql/inputs/withdraw-wallet.input'
import { Wallet } from '../graphql/type/wallet.type'

@Resolver(() => Wallet)
export class WalletResolver {
    constructor(
        private readonly _walletService: WalletService,
        private readonly _transactionService: TransactionService,
    ) {}

    // QUERY

    @Query(() => Wallet, {
        name: 'wallet',
        description: 'Getting one wallet by its ID.',
    })
    async wallet(
        @Args('id', { description: 'wallet id' }) id: number,
    ): Promise<Wallet> {
        return await this._walletService.findOne(id)
    }

    @Query(() => [Wallet], {
        name: 'wallets',
        description: 'Getting all wallets.',
    })
    async wallets(): Promise<Wallet[]> {
        return await this._walletService.findAll()
    }

    @ResolveField(() => [Transaction], {
        name: 'transactions',
        description: 'Allows you to get a list of wallet transactions',
    })
    async transactions(@Parent() wallet: Wallet) {
        const { id } = wallet

        return this._transactionService.findAll(id)
    }

    // MUTATION

    @Mutation(() => Wallet, {
        name: 'createWallet',
        description:
            'Creating a user wallet. The user ID is received as input.',
    })
    async createWallet(
        @Args('id', { description: 'user id' }) id: number,
    ): Promise<Wallet> {
        return await this._walletService.create(id)
    }

    @Mutation(() => String, {
        name: 'close',
        description: `
            Closes the user's wallet. The user ID and wallet ID are received as input.
    `,
    })
    async close(
        @Args('closeWalletInput') closeWalletInput: CloseWalletInput,
    ): Promise<String> {
        return await this._walletService.close(closeWalletInput)
    }

    @Mutation(() => String, {
        name: 'deposit',
        description: `Replenishes the user's wallet for a certain amount. The input accepts the amount, user ID and wallet.`,
    })
    async deposit(
        @Args('depositWalletInput') depositWalletInput: DepositWalletInput,
    ): Promise<String> {
        return await this._walletService.deposit(depositWalletInput)
    }

    @Mutation(() => String, {
        name: 'withdraw',
        description: `Withdraws a certain amount from the user's wallet. The input accepts the amount, user ID and wallet.`,
    })
    async withdraw(
        @Args('withdrawWalletInput') withdrawWalletInput: WithdrawWalletInput,
    ): Promise<String> {
        return await this._walletService.withdraw(withdrawWalletInput)
    }

    @Mutation(() => String, {
        name: 'transfer',
        description: `Transferring money from one wallet to another. The input accepts the id of the wallet from which the transfer is to be made and the id of the wallet to which funds and the amount to be transferred should be received.`,
    })
    async transfer(
        @Args('transferWalletInput') transferWalletInput: TransferWalletInput,
    ): Promise<String> {
        return await this._walletService.transfer(transferWalletInput)
    }
}
