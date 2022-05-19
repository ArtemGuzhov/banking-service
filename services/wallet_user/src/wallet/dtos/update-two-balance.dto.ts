export class UpdateTwoBalanceDto {
    updateData: [
        { wallet_id: number; sum: number; operation: string },
        { wallet_id: number; sum: number; operation: string },
    ]
}
