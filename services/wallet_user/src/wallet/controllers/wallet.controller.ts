import { Controller } from '@nestjs/common'
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices'
import { WalletService } from '../services/wallet.service'

@Controller('wallet')
export class WalletController {
    constructor(private readonly _walletService: WalletService) {}

    @EventPattern('response-to-wallet-user')
    async updateBalance(
        @Payload() data: { status: number },
        @Ctx() context: RmqContext,
    ) {
        const channel = context.getChannelRef()
        const orginalMessage = context.getMessage()

        channel.ack(orginalMessage)

        return this._walletService.changeStatus(data.status)
    }
}
