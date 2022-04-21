import { WalletEntity } from 'src/wallet/models/wallet.entity'
import {
    PrimaryGeneratedColumn,
    Column,
    Entity,
    OneToMany,
    DeleteDateColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm'

@Entity(`user`)
export class UserEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({ unique: true })
    email: string

    @CreateDateColumn()
    created_at: Date

    @UpdateDateColumn()
    updated_at: Date

    @OneToMany(() => WalletEntity, (wallet) => wallet.user, {
        cascade: true,
    })
    wallets: WalletEntity[]

    @DeleteDateColumn({ nullable: true })
    deleted_at?: Date
}
