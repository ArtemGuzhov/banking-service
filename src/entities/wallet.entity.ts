import { Field, ObjectType, ID } from '@nestjs/graphql'
import {
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    Column,
    Entity,
    OneToMany,
} from 'typeorm'
import { TransactionEntity } from './transaction.entity'

@ObjectType()
@Entity(`wallet`)
export class WalletEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn()
    id: number

    @Field({ defaultValue: 0 })
    @Column({ default: 0 })
    balance: number

    @Field({ defaultValue: 0 })
    @Column({ default: true })
    status: boolean

    @Field()
    @CreateDateColumn()
    created_at: Date

    @Field()
    @UpdateDateColumn()
    updated_at: Date

    @Field({ nullable: true })
    @Column({ nullable: true })
    closed_at: Date

    @Field(() => [TransactionEntity])
    @OneToMany(() => TransactionEntity, (transaction) => transaction.wallet, {
        eager: true,
        cascade: true,
    })
    transactions: TransactionEntity[]
}
