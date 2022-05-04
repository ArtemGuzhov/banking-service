import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
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
    ],
    providers: [TransactionService, TransactionResolver],
    exports: [TransactionService],
})
export class TransactionModule {}
