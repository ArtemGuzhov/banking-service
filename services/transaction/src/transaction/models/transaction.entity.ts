import {
    CreateDateColumn,
    PrimaryGeneratedColumn,
    Column,
    Entity,
} from 'typeorm'

@Entity(`Transaction`)
export class TransactionEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    operation: string

    @Column()
    sum: number

    @Column()
    wallet_id: number

    @Column({ nullable: true })
    from?: number

    @Column({ nullable: true })
    to?: number

    @CreateDateColumn()
    created_at: Date
}
