import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TransactionEntity } from './models/transaction.entity'
import { TransactionResolver } from './resolvers/transaction.resolver'
import { TransactionService } from './services/transaction.service'

@Module({
    imports: [TypeOrmModule.forFeature([TransactionEntity])],
    providers: [TransactionService, TransactionResolver],
})
export class TransactionModule {}
