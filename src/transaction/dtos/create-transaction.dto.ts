import { WalletEntity } from 'src/wallet/models/wallet.entity'

export class CreateTransactionDto {
    operation: string
    sum: number
    wallet: WalletEntity
    from?: number
    to?: number
}
