import { Controller } from '@nestjs/common'
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices'
import { CreateTransactionDto } from '../dtos/create-transaction.dto'
import { FindAllTransactionsDto } from '../dtos/find-all-transactions'
import { FindTransactionDto } from '../dtos/find-transaction.dto'
import { TransactionService } from '../services/transaction.service'

@Controller('transaction')
export class TransactionController {
    constructor(private readonly _transactionService: TransactionService) {}

    @MessagePattern('producer-create')
    async create(
        @Payload() data: CreateTransactionDto,
        @Ctx() context: RmqContext,
    ) {
        const channel = context.getChannelRef()
        const orginalMessage = context.getMessage()

        channel.ack(orginalMessage)

        return await this._transactionService.create(data)
    }

    @MessagePattern('producer-find-all')
    async findAll(
        @Payload() data: FindAllTransactionsDto,
        @Ctx() context: RmqContext,
    ) {
        const channel = context.getChannelRef()
        const orginalMessage = context.getMessage()
        channel.ack(orginalMessage)

        return await this._transactionService.findAll(data)
    }

    @MessagePattern('producer-find-one')
    async findOne(
        @Payload() data: FindTransactionDto,
        @Ctx() context: RmqContext,
    ) {
        const channel = context.getChannelRef()
        const orginalMessage = context.getMessage()
        channel.ack(orginalMessage)

        return await this._transactionService.findOne(data.id)
    }
}
