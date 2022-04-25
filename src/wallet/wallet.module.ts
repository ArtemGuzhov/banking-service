import { Module } from '@nestjs/common'
import { WalletService } from './services/wallet.service'
import { WalletResolver } from './resolvers/wallet.resolver'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TransactionService } from 'src/transaction/services/transaction.service'
import { UserService } from 'src/user/services/user.service'
import { WalletEntity } from './models/wallet.entity'
import { TransactionEntity } from 'src/transaction/models/transaction.entity'
import { UserEntity } from 'src/user/models/user.entity'
import { TransactionModule } from 'src/transaction/transaction.module'

@Module({
    imports: [
        TransactionModule,
        TypeOrmModule.forFeature([WalletEntity]),
        TypeOrmModule.forFeature([UserEntity]),
        TypeOrmModule.forFeature([TransactionEntity]),
    ],
    providers: [WalletService, WalletResolver, UserService, TransactionService],
})
export class WalletsModule {}
