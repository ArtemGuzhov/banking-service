import { Field, ObjectType, ID } from '@nestjs/graphql'
import { Transaction } from 'src/transaction/models/transaction.interface'
import { User } from 'src/user/models/user.interface'

@ObjectType()
export class Wallet {
    @Field(() => ID)
    id: number

    @Field({ defaultValue: 0 })
    balance: number

    @Field({ defaultValue: true })
    status: boolean

    @Field()
    created_at: Date

    @Field()
    updated_at: Date

    @Field({ nullable: true })
    closed_at?: Date

    @Field(() => User)
    user: User

    @Field(() => [Transaction], { defaultValue: [] })
    transactions: Transaction[]
}
