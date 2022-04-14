import { Field, ObjectType, ID } from '@nestjs/graphql'
import {
    CreateDateColumn,
    PrimaryGeneratedColumn,
    Column,
    Entity,
    ManyToOne,
    JoinColumn,
} from 'typeorm'
import { WalletEntity } from './wallet.entity'

@ObjectType()
@Entity(`transaction`)
export class TransactionEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: number

    @Field()
    @Column()
    operation: string

    @Field()
    @Column()
    sum: number

    @Field()
    @CreateDateColumn()
    created_at: Date

    @Field(() => WalletEntity)
    @ManyToOne(() => WalletEntity, (wallet) => wallet.transactions)
    @JoinColumn({ name: 'wallet_id' })
    wallet?: WalletEntity
}
