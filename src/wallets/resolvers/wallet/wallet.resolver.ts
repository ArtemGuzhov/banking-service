import { Args, Mutation, Resolver, Query } from '@nestjs/graphql'
import { WalletEntity } from 'src/entities/wallet.entity'
import { DepositWalletInput } from 'src/wallets/inputs/deposit-wallet.input'
import { WithdrawWalletInput } from 'src/wallets/inputs/withdraw-wallet.input'
import { WalletService } from 'src/wallets/services/wallet/wallet.service'

@Resolver('Wallet')
export class WalletResolver {
    constructor(private readonly walletService: WalletService) {}

    // QUERY

    @Query(() => WalletEntity)
    async getOneWallet(@Args('id') id: number): Promise<WalletEntity> {
        return await this.walletService.getOneWallet(id)
    }

    @Query(() => [WalletEntity])
    async getWallets(): Promise<WalletEntity[]> {
        return await this.walletService.getAllWallets()
    }

    // MUTATION

    @Mutation(() => WalletEntity)
    async createWallet(): Promise<WalletEntity> {
        return await this.walletService.createWallet()
    }

    @Mutation(() => String)
    async closeWallet(@Args('id') id: number): Promise<String> {
        return await this.walletService.closeWallet(id)
    }

    @Mutation(() => Number)
    async depositWallet(
        @Args('depositWallet') depositWalletInput: DepositWalletInput,
    ): Promise<Number> {
        return await this.walletService.depositWallet(depositWalletInput)
    }

    @Mutation(() => Number)
    async withdrawWallet(
        @Args('withdrawWallet') withdrawWalletInput: WithdrawWalletInput,
    ): Promise<Number> {
        return await this.walletService.withdrawWallet(withdrawWalletInput)
    }
}
