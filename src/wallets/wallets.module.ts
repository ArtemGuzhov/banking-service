import { Module } from '@nestjs/common'
import { WalletService } from './services/wallet/wallet.service'
import { WalletResolver } from './resolvers/wallet/wallet.resolver'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WalletEntity } from 'src/entities/wallet.entity'
import { TransactionEntity } from 'src/entities/transaction.entity'

@Module({
    imports: [
        TypeOrmModule.forFeature([WalletEntity]),
        TypeOrmModule.forFeature([TransactionEntity]),
    ],
    providers: [WalletService, WalletResolver],
})
export class WalletsModule {}
