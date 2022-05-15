import { forwardRef, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { WalletsModule } from 'src/wallet/wallet.module'
import { TransactionResolver } from './resolvers/transaction.resolver'
import { TransactionService } from './services/transaction.service'

// rabbitmq
@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'rabbit-mq-module',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://user:user@rabbitmq:5672'],
                    queue: 'transaction',
                },
            },
        ]),
        forwardRef(() => WalletsModule),
    ],
    providers: [TransactionService, TransactionResolver],
    exports: [TransactionService],
})
export class TransactionModule {}
