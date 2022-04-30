export class CreateTransactionDto {
    operation: string
    sum: number
    wallet_id: number
    from?: number
    to?: number
}
