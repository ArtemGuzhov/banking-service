import { HttpModule } from '@nestjs/axios'
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
<<<<<<< Updated upstream
                    urls: ['amqp://user:user@rabbitmq:5672'],
                    queue: 'rabbit-mq-nest-js',
=======
                    urls: ['amqp://user:user@localhost:5672'],
                    queue: 'transaction',
>>>>>>> Stashed changes
                },
            },
        ]),
        forwardRef(() => WalletsModule),
        HttpModule,
    ],
    providers: [TransactionService, TransactionResolver],
    exports: [TransactionService],
})
export class TransactionModule {}
