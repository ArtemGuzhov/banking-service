import { Field, InputType, ID } from '@nestjs/graphql'
import { Type } from 'class-transformer'
import { IsInt, IsNotEmpty, Min } from 'class-validator'

@InputType()
export class DepositWalletInput {
    @Field(() => ID, { description: 'Please, input user id' })
    @Type(() => Number)
    @IsNotEmpty({ message: 'The "userId" field must not be empty' })
    @IsInt({ message: 'The "userId" field must be a number' })
    userId: number

    @Field(() => ID, { description: 'Please, input wallet id' })
    @Type(() => Number)
    @IsNotEmpty({ message: 'The "walletId" field must not be empty' })
    @IsInt({ message: 'The "walletId" field must be a number' })
    walletId: number

    @Field({ description: 'Please, input sum for deposit' })
    @Type(() => Number)
    @IsNotEmpty({ message: 'The "sum" field must not be empty' })
    @IsInt({ message: 'The "sum" field must be a number' })
    @Min(100, { message: 'The minimum value of the "sum" field is 100.' })
    sum: number
}
