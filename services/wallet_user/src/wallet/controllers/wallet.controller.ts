import { Controller } from '@nestjs/common'
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices'
import { UpdateBalanceDto } from '../dtos/update-balance.dto'
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
}
