import { forwardRef, Module } from '@nestjs/common'
import { WalletService } from './services/wallet.service'
import { WalletResolver } from './resolvers/wallet.resolver'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WalletEntity } from './models/wallet.entity'
import { UserModule } from 'src/user/user.module'
import { TransactionModule } from 'src/transaction/transaction.module'
import { WalletController } from './controllers/wallet.controller'
import { ClientsModule, Transport } from '@nestjs/microservices'

@Module({
    imports: [
        TypeOrmModule.forFeature([WalletEntity]),
        forwardRef(() => UserModule),
        forwardRef(() => TransactionModule),
        ClientsModule.register([
            {
                name: 'rabbit-mq-module',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://user:user@localhost:5672'],
                    queue: 'transaction',
                },
            },
        ]),
    ],
    providers: [WalletService, WalletResolver],
    exports: [WalletService],
    controllers: [WalletController],
})
export class WalletsModule {}
