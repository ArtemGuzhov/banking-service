export class TransactionDto {
    id: number

    operation: string

    sum: number

    from?: number

    to?: number

    created_at: Date

    wallet_id: number
}
