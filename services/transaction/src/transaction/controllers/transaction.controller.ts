import { Controller } from '@nestjs/common'
import {
    Ctx,
    EventPattern,
    // MessagePattern,
    Payload,
    RmqContext,
} from '@nestjs/microservices'
import { CreateTransactionDto } from '../dtos/create-transaction.dto'
// import { FindAllTransactionsDto } from '../dtos/find-all-transactions'
// import { FindTransactionDto } from '../dtos/find-transaction.dto'
import { TransactionService } from '../services/transaction.service'

@Controller('transaction')
export class TransactionController {
    constructor(private readonly _transactionService: TransactionService) {}

    @EventPattern('producer-create')
    async create(
        @Payload() data: CreateTransactionDto,
        @Ctx() context: RmqContext,
    ) {
        const channel = context.getChannelRef()
        const orginalMessage = context.getMessage()

        channel.ack(orginalMessage)

        return await this._transactionService.create(data)
    }

    @EventPattern('producer-two-create')
    async createTwo(
        @Payload() data: CreateTransactionDto[],
        @Ctx() context: RmqContext,
    ) {
        const channel = context.getChannelRef()
        const orginalMessage = context.getMessage()

        channel.ack(orginalMessage)

        return await this._transactionService.createTwo(data)
    }

    @EventPattern('response-for-transaction-microservice')
    async changeStatus(
        @Payload() data: { status: number },
        @Ctx() context: RmqContext,
    ) {
        const channel = context.getChannelRef()
        const orginalMessage = context.getMessage()

        channel.ack(orginalMessage)

        return await this._transactionService.changeStatus(data.status)
    }
}
