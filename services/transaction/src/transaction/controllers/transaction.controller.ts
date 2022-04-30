import { Controller, Logger } from '@nestjs/common'
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices'
import { CreateTransactionDto } from '../dtos/create-transaction.dto'
import { FindTransactionDto } from '../dtos/find-transaction.dto'
import { TransactionService } from '../services/transaction.service'

@Controller('transaction')
export class TransactionController {
    logger: Logger

    constructor(private readonly transactionService: TransactionService) {
        this.logger = new Logger(TransactionController.name)
    }

    @MessagePattern('rabbit-mq-producer')
    async create(
        @Payload() data: CreateTransactionDto,
        @Ctx() context: RmqContext,
    ) {
        this.logger.debug({ ...data })

        const channel = context.getChannelRef()
        const orginalMessage = context.getMessage()
        channel.ack(orginalMessage)

        return await this.transactionService.create(data)
    }

    @MessagePattern('rabbit-mq-producer-2')
    async findAll(
        @Payload() data: CreateTransactionDto,
        @Ctx() context: RmqContext,
    ) {
        this.logger.debug({ ...data })

        const channel = context.getChannelRef()
        const orginalMessage = context.getMessage()
        channel.ack(orginalMessage)

        return await this.transactionService.findAll()
    }

    @MessagePattern('rabbit-mq-producer-3')
    async findOne(
        @Payload() data: FindTransactionDto,
        @Ctx() context: RmqContext,
    ) {
        this.logger.debug({ ...data })

        const channel = context.getChannelRef()
        const orginalMessage = context.getMessage()
        channel.ack(orginalMessage)

        return await this.transactionService.findOne(data.id)
    }
}
