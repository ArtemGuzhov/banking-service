import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TransactionEntity } from 'src/entities/transaction.entity'
import { TransactionResolver } from './resolvers/transaction/transaction.resolver'
import { TransactionService } from './services/transaction/transaction.service'

@Module({
    imports: [TypeOrmModule.forFeature([TransactionEntity])],
    providers: [TransactionService, TransactionResolver],
})
export class TransactionModule {}
