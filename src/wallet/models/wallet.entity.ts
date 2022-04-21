import { TransactionEntity } from 'src/transaction/models/transaction.entity'
import { UserEntity } from 'src/user/models/user.entity'
import {
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    Column,
    Entity,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm'

@Entity(`wallet`)
export class WalletEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ default: 0 })
    balance: number

    @Column({ default: true })
    status: boolean

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @Column({ nullable: true })
    closed_at?: Date

    @ManyToOne(() => UserEntity, (user) => user.wallets)
    @JoinColumn({ name: 'user_id' })
    user: UserEntity

    @OneToMany(() => TransactionEntity, (transaction) => transaction.wallet, {
        cascade: true,
    })
    transactions: TransactionEntity[]
}
