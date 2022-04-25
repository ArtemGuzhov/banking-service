import { Field, InputType, ID } from '@nestjs/graphql'
import { Type } from 'class-transformer'
import { IsInt, IsNotEmpty, Max, Min } from 'class-validator'

@InputType()
export class TransferWalletInput {
    @Field(() => ID, { description: 'Please, input sender`s wallet id' })
    @Type(() => Number)
    @IsNotEmpty({ message: 'The "from" field must not be empty' })
    @IsInt({ message: 'The "from" field must be a number' })
    from: number

    @Field(() => ID, { description: 'Please, input recipient`s wallet id' })
    @Type(() => Number)
    @IsNotEmpty({ message: 'The "to" field must not be empty' })
    @IsInt({ message: 'The "to" field must be a number' })
    to: number

    @Field({ description: 'Please, input sum for transfet' })
    @Type(() => Number)
    @IsNotEmpty({ message: 'The "sum" field must not be empty' })
    @IsInt({ message: 'The "sum" field must be a number' })
    @Min(10, { message: 'The minimum value of the "sum" field is 10.' })
    @Max(100000, { message: 'The maximum value of the "sum" field is 100000.' })
    sum: number
}
