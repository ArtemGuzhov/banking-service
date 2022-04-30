import { Field, ObjectType, ID } from '@nestjs/graphql'
import { Wallet } from 'src/wallet/models/wallet.interface'

@ObjectType()
export class User {
    @Field(() => ID)
    id: number

    @Field()
    name: string

    @Field()
    email: string

    @Field()
    created_at: Date

    @Field()
    updated_at: Date

    @Field(() => [Wallet], { defaultValue: [] })
    wallets: Wallet[]

    @Field({ nullable: true })
    deleted_at?: Date
}
