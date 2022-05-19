export class CreateTwoTransactionDto {
    transactionData: [
        {
            operation: string

            sum: number

            wallet_id: number

            from?: number

            to?: number

            operation_for_update?: string
        },
    ]
}
