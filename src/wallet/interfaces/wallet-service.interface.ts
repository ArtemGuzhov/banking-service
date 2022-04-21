export interface IClose {
    userId: number
    walletId: number
}

export interface IDeposit {
    userId: number
    walletId: number
    sum: number
}

export interface IWithdraw {
    userId: number
    walletId: number
    sum: number
}

export interface ITransfer {
    from: number
    to: number
    sum: number
}
