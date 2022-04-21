import { Field, InputType, ID } from '@nestjs/graphql'
import { Type } from 'class-transformer'
import { IsNotEmpty, IsInt } from 'class-validator'

@InputType()
export class CloseWalletInput {
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
}
