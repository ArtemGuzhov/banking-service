import { Field, ObjectType, ID } from '@nestjs/graphql'
import { Wallet } from 'src/wallet/models/wallet.interface'

@ObjectType()
export class Transaction {
    @Field(() => ID)
    id: number

    @Field()
    operation: string

    @Field()
    sum: number

    @Field({ nullable: true })
    from?: number

    @Field({ nullable: true })
    to?: number

    @Field()
    created_at: Date

    @Field(() => Wallet)
    wallet: Wallet
}
