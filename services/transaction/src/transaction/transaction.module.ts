import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TransactionController } from './controllers/transaction.controller'
import { TransactionEntity } from './models/transaction.entity'
import { TransactionService } from './services/transaction.service'

@Module({
    imports: [
        TypeOrmModule.forFeature([TransactionEntity]),
        // ClientsModule.register([
        //     {
        //         name: 'TRANSACTION_SERVICE',
        //         transport: Transport.RMQ,
        //         options: {
        //             urls: ['amqp://user:user@localhost:5672'],
        //             queue: 'main_queue',
        //             queueOptions: {
        //                 durable: false,
        //             },
        //         },
        //     },
        // ]),
    ],
    controllers: [TransactionController],
    providers: [TransactionService],
})
export class TransactionModule {}
