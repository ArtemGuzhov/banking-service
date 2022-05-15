import { Type } from 'class-transformer'
import { IsNotEmpty, IsString } from 'class-validator'

export class CreateTransactionDto {
    @IsNotEmpty({ message: 'The "operation" field must not be empty' })
    @IsString()
    operation: string

    @IsNotEmpty({ message: 'The "sum" field must not be empty' })
    @Type(() => Number)
    sum: number

    @IsNotEmpty({ message: 'The "sum" field must not be empty' })
    @Type(() => Number)
    wallet_id: number

    @Type(() => Number)
    from?: number

    @Type(() => Number)
    to?: number

    @Type(() => String)
    operation_for_update?: string
}
