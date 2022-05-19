export class CreateTransactionDto {
    wallet_id: number
    sum: number
    from?: number
    to?: number
    operation: string
}
