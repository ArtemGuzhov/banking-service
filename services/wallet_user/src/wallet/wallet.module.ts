import { forwardRef, Module } from '@nestjs/common'
import { WalletService } from './services/wallet.service'
import { WalletResolver } from './resolvers/wallet.resolver'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WalletEntity } from './models/wallet.entity'
import { UserModule } from 'src/user/user.module'
import { TransactionModule } from 'src/transaction/transaction.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([WalletEntity]),
        forwardRef(() => UserModule),
        forwardRef(() => TransactionModule),
    ],
    providers: [WalletService, WalletResolver],
    exports: [WalletService],
})
export class WalletsModule {}
