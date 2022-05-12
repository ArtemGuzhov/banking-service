import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TransactionController } from './controllers/transaction.controller'
import { TransactionEntity } from './models/transaction.entity'
import { TransactionService } from './services/transaction.service'

@Module({
    imports: [TypeOrmModule.forFeature([TransactionEntity])],
    controllers: [TransactionController],
    providers: [TransactionService],
})
export class TransactionModule {}
