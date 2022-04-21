import { WalletEntity } from 'src/wallet/models/wallet.entity'
import {
    CreateDateColumn,
    PrimaryGeneratedColumn,
    Column,
    Entity,
    ManyToOne,
    JoinColumn,
} from 'typeorm'

@Entity(`transaction`)
export class TransactionEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    operation: string

    @Column()
    sum: number

    @Column({ nullable: true })
    from?: number

    @Column({ nullable: true })
    to?: number

    @CreateDateColumn()
    created_at: Date

    @ManyToOne(() => WalletEntity, (wallet) => wallet.transactions)
    @JoinColumn({ name: 'wallet_id' })
    wallet: WalletEntity
}
