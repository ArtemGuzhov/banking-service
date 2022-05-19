import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TransactionController } from './controllers/transaction.controller'
import { TransactionEntity } from './models/transaction.entity'
import { TransactionService } from './services/transaction.service'
import { TransactionResolver } from './resolvers/transaction.resolver'

@Module({
<<<<<<< Updated upstream
    imports: [TypeOrmModule.forFeature([TransactionEntity])],
=======
    imports: [
        TypeOrmModule.forFeature([TransactionEntity]),
        ClientsModule.register([
            {
                name: 'rabbit-mq-module',
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://user:user@localhost:5672'],
                    queue: 'wallet-user',
                },
            },
        ]),
    ],
>>>>>>> Stashed changes
    controllers: [TransactionController],
    providers: [TransactionService, TransactionResolver],
})
export class TransactionModule {}
