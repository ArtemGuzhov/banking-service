import { forwardRef, Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { WalletsModule } from 'src/wallet/wallet.module'
import { TransactionResolver } from './resolvers/transaction.resolver'
import { TransactionService } from './services/transaction.service'

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'rabbit-mq-module',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://user:user@rabbitmq:5672'],
                    queue: 'rabbit-mq-nest-js',
                },
            },
        ]),
        forwardRef(() => WalletsModule),
    ],
    providers: [TransactionService, TransactionResolver],
    exports: [TransactionService],
})
export class TransactionModule {}
