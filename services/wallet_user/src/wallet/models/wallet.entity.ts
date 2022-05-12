import { UserEntity } from 'src/user/models/user.entity'
import {
    CreateDateColumn,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    Column,
    Entity,
    ManyToOne,
    JoinColumn,
    AfterLoad,
} from 'typeorm'

@Entity(`Wallet`)
export class WalletEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ default: 0, select: true })
    incoming: number

    @Column({ default: 0, select: true })
    outgoing: number

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


    balance: number

    @AfterLoad()
    updateBalance() {
        this.balance = this.incoming - this.outgoing
    }
}
