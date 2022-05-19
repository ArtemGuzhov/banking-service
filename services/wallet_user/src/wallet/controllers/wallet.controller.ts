import { Controller } from '@nestjs/common'
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices'
import { UpdateBalanceDto } from '../dtos/update-balance.dto'
import { UpdateStatusDto } from '../dtos/update-status.dto'
import { UpdateTwoBalanceDto } from '../dtos/update-two-balance.dto'
import { WalletService } from '../services/wallet.service'

@Controller('wallet')
export class WalletController {
    constructor(private readonly _walletService: WalletService) {}

    @EventPattern('producer-balance')
    async updateBalance(
        @Payload() data: UpdateBalanceDto,
        @Ctx() context: RmqContext,
    ) {
        const channel = context.getChannelRef()
        const orginalMessage = context.getMessage()

        channel.ack(orginalMessage)

        return this._walletService.updateBalance({ ...data })
    }

    @EventPattern('producer-update-status')
    async updateStatus(
        @Payload() data: UpdateStatusDto,
        @Ctx() context: RmqContext,
    ) {
        const channel = context.getChannelRef()
        const orginalMessage = context.getMessage()

        channel.ack(orginalMessage)

        return this._walletService.updateMicroservicesStatus({ ...data })
    }

    @EventPattern('producer-two-balance')
    async updateTwoBalance(
        @Payload() data: UpdateTwoBalanceDto,
        @Ctx() context: RmqContext,
    ) {
        const channel = context.getChannelRef()
        const orginalMessage = context.getMessage()

        channel.ack(orginalMessage)

        return this._walletService.updateTwoBalance(data)
    }
}
