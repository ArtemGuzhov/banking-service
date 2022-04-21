import { Args, Mutation, Resolver, Query } from '@nestjs/graphql'
import { DepositWalletInput } from 'src/wallet/inputs/deposit-wallet.input'
import { WithdrawWalletInput } from 'src/wallet/inputs/withdraw-wallet.input'
import { WalletService } from 'src/wallet/service/wallet.service'
import { CloseWalletInput } from '../inputs/close-wallet.input'
import { TransferWalletInput } from '../inputs/transfer-wallet.input'
import { Wallet } from '../models/wallet.interface'

@Resolver('wallet')
export class WalletResolver {
    constructor(private readonly walletService: WalletService) {}

    // QUERY

    @Query(() => Wallet, {
        name: 'wallet',
        description: 'Getting one wallet by its ID.',
    })
    async wallet(
        @Args('id', { description: 'wallet id' }) id: number,
    ): Promise<Wallet> {
        return await this.walletService.findOne(id)
    }

    @Query(() => [Wallet], {
        name: 'wallets',
        description: 'Getting all wallets.',
    })
    async wallets(
        @Args('filter', {
            description: "Filters: ['active', 'closed'].",
            nullable: true,
        })
        filter?: string,
    ): Promise<Wallet[]> {
        return await this.walletService.findAll(filter)
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
        return await this.walletService.create(id)
    }

    @Mutation(() => String, {
        name: 'close',
        description: `
            Closes the user's wallet. The user ID and wallet ID are received as input.
    `,
    })
    async close(
        @Args('closeWallet') closeWalletInput: CloseWalletInput,
    ): Promise<String> {
        return await this.walletService.close(closeWalletInput)
    }

    @Mutation(() => Number, {
        name: 'deposit',
        description: `Replenishes the user's wallet for a certain amount. The input accepts the amount, user ID and wallet.`,
    })
    async deposit(
        @Args('depositWallet') depositWalletInput: DepositWalletInput,
    ): Promise<Number> {
        return await this.walletService.deposit(depositWalletInput)
    }

    @Mutation(() => Number, {
        name: 'withdraw',
        description: `Withdraws a certain amount from the user's wallet. The input accepts the amount, user ID and wallet.`,
    })
    async withdraw(
        @Args('withdrawWallet') withdrawWalletInput: WithdrawWalletInput,
    ): Promise<Number> {
        return await this.walletService.withdraw(withdrawWalletInput)
    }

    @Mutation(() => Number, {
        name: 'transfer',
        description: `Transferring money from one wallet to another. The input accepts the id of the wallet from which the transfer is to be made and the id of the wallet to which funds and the amount to be transferred should be received.`,
    })
    async transfer(
        @Args('transferWallet') transferWalletInput: TransferWalletInput,
    ): Promise<Number> {
        return await this.walletService.transfer(transferWalletInput)
    }
}
