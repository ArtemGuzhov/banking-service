import { Controller, Logger } from '@nestjs/common'
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices'
import { CreateTransactionDto } from '../dtos/create-transaction.dto'
import { FindAllTransactionsDto } from '../dtos/find-all-transactions'
import { FindTransactionDto } from '../dtos/find-transaction.dto'
import { TransactionService } from '../services/transaction.service'

@Controller('transaction')
export class TransactionController {
    logger: Logger

    constructor(private readonly transactionService: TransactionService) {
        this.logger = new Logger(TransactionController.name)
    }

    @MessagePattern('producer-create')
    async create(
        @Payload() data: CreateTransactionDto,
        @Ctx() context: RmqContext,
    ) {
        this.logger.debug('producer-create')

        const channel = context.getChannelRef()
        const orginalMessage = context.getMessage()
        channel.ack(orginalMessage)

        return await this.transactionService.create(data)
    }

    @MessagePattern('producer-find-all')
    async findAll(
        @Payload() data: FindAllTransactionsDto,
        @Ctx() context: RmqContext,
    ) {
        this.logger.debug('producer-find-all')

        const channel = context.getChannelRef()
        const orginalMessage = context.getMessage()
        channel.ack(orginalMessage)

        return await this.transactionService.findAll(data)
    }

    @MessagePattern('producer-find-one')
    async findOne(
        @Payload() data: FindTransactionDto,
        @Ctx() context: RmqContext,
    ) {
        this.logger.debug('producer-find-one')

        const channel = context.getChannelRef()
        const orginalMessage = context.getMessage()
        channel.ack(orginalMessage)

        return await this.transactionService.findOne(data.id)
    }
}
