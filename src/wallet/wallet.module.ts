import { forwardRef, Module } from '@nestjs/common'
import { WalletService } from './services/wallet.service'
import { WalletResolver } from './resolvers/wallet.resolver'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WalletEntity } from './models/wallet.entity'
import { UserModule } from 'src/user/user.module'

@Module({
    imports: [
        TypeOrmModule.forFeature([WalletEntity]),
        forwardRef(() => UserModule),
    ],
    providers: [WalletService, WalletResolver],
})
export class WalletsModule {}
