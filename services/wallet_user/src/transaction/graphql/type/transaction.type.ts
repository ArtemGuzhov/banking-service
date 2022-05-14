import { Field, ObjectType, ID } from '@nestjs/graphql'

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

    wallet_id: number
}
