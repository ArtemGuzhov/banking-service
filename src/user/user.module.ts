import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TransactionEntity } from 'src/transaction/models/transaction.entity'
import { TransactionService } from 'src/transaction/services/transaction.service'
import { WalletEntity } from 'src/wallet/models/wallet.entity'
import { WalletService } from 'src/wallet/service/wallet.service'
// import { WalletService } from 'src/wallet/service/wallet.service'
import { UserEntity } from './models/user.entity'
import { UserResolver } from './resolver/user.resolver'
import { UserService } from './service/user.service'

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity]),
        TypeOrmModule.forFeature([WalletEntity]),
        TypeOrmModule.forFeature([TransactionEntity]),
    ],
    providers: [UserResolver, TransactionService, UserService, WalletService],
    exports: [UserService],
})
export class UserModule {}
