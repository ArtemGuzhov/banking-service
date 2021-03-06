import { Field, ObjectType, ID } from '@nestjs/graphql'
import { User } from 'src/user/graphql/type/user.type'

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
}
