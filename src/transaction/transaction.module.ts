import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from 'src/user/models/user.entity'
import { UserService } from 'src/user/service/user.service'
import { WalletEntity } from 'src/wallet/models/wallet.entity'
import { WalletService } from 'src/wallet/service/wallet.service'
import { TransactionEntity } from './models/transaction.entity'
import { TransactionResolver } from './resolvers/transaction.resolver'
import { TransactionService } from './services/transaction.service'

@Module({
    imports: [
        TypeOrmModule.forFeature([TransactionEntity]),
        TypeOrmModule.forFeature([WalletEntity]),
        TypeOrmModule.forFeature([UserEntity]),
    ],
    providers: [
        TransactionService,
        TransactionResolver,
        WalletService,
        UserService,
    ],
})
export class TransactionModule {}
