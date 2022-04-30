import {
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { CreateTransactionDto } from 'src/wallet/dtos/create-transaction.dto'
import { TransactionDto } from '../dtos/outputs/transaction.dto'

@Injectable()
export class TransactionService {
    logger: Logger

    constructor(
        @Inject('rabbit-mq-module') private readonly client: ClientProxy,
    ) {
        this.logger = new Logger(TransactionService.name)
    }

    // QUERY

    async findAll(): Promise<TransactionDto[]> {
        try {
            const transactions = await this.client
                .send('rabbit-mq-producer-2', {})
                .toPromise()

            return transactions
        } catch (error) {
            this.logger.error(error)

            throw error
        }
    }

    async findOne(id: number): Promise<TransactionDto> {
        try {
            const transaction = await this.client
                .send('rabbit-mq-producer-3', { id })
                .toPromise()

            if (!transaction) {
                throw new HttpException(
                    'Transaction not found',
                    HttpStatus.NOT_FOUND,
                )
            }

            return transaction
        } catch (error) {
            this.logger.error(error)

            throw error
        }
    }

    // // MUTATION

    async create(createDto: CreateTransactionDto): Promise<TransactionDto> {
        try {
            const { from, to, sum, operation, wallet_id } = createDto

            if (from && to) {
                return await this.client
                    .send('rabbit-mq-producer', {
                        operation,
                        sum,
                        wallet_id,
                        from,
                        to,
                    })
                    .toPromise()
            } else {
                return await this.client
                    .send('rabbit-mq-producer', {
                        operation,
                        sum,
                        wallet_id,
                    })
                    .toPromise()
            }
        } catch (error) {
            this.logger.error(error)

            throw error
        }
    }
}
