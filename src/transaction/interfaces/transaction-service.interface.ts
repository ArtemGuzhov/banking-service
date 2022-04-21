import { WalletEntity } from 'src/wallet/models/wallet.entity'

export interface ICreate {
    operation: string
    sum: number
    wallet: WalletEntity
    from?: number
    to?: number
}

// export interface IFilter {
//     deposit: string

//     withdraw: string

//     transfer: string

//     receipt: string
// }
