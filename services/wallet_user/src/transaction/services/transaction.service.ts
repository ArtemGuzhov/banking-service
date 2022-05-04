import {
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { timeout } from 'rxjs'
import { CreateTransactionDto } from 'src/wallet/dtos/create-transaction.dto'
import { FindTransactionDto } from '../dtos/inputs/find-transaction.dto'
import { TransactionDto } from '../dtos/outputs/transaction.dto'

interface FindData {
    [key: string]: number
}

@Injectable()
export class TransactionService {
    logger: Logger

    constructor(
        @Inject('rabbit-mq-module') private readonly client: ClientProxy,
    ) {
        this.logger = new Logger(TransactionService.name)
    }

    // QUERY

    async findAll(id?: number): Promise<TransactionDto[]> {
        try {
            const data: FindData = {}

            if (id) {
                data['id'] = id
            }

            const transactions = await this.client
                .send<TransactionDto[], any>('producer-find-all', data)
                .pipe(timeout(5000))
                .toPromise()

            if (!transactions) {
                throw {
                    message: 'Transactions not found',
                    status: HttpStatus.NOT_FOUND,
                }
            }

            return transactions
        } catch (error) {
            this.logger.error(error)

            throw new HttpException(error.message, error.status)
        }
    }

    async findOne(id: number): Promise<TransactionDto> {
        try {
            const transaction = await this.client
                .send<TransactionDto, FindTransactionDto>('producer-find-one', {
                    id,
                })
                .pipe(timeout(5000))
                .toPromise()

            if (!transaction) {
                throw {
                    message: 'Transaction not found',
                    status: HttpStatus.NOT_FOUND,
                }
            }

            return transaction
        } catch (error) {
            this.logger.error(error)

            throw new HttpException(error.message, error.status)
        }
    }

    async create(createDto: CreateTransactionDto): Promise<TransactionDto> {
        try {
            const { from, to, sum, operation, wallet_id } = createDto

            if (from && to) {
                const transaction = await this.client
                    .send<TransactionDto, CreateTransactionDto>(
                        'producer-create',
                        {
                            operation,
                            sum,
                            wallet_id,
                            from,
                            to,
                        },
                    )
                    .pipe(timeout(5000))
                    .toPromise()

                if (!transaction) {
                    throw new HttpException(
                        'Connect error',
                        HttpStatus.INTERNAL_SERVER_ERROR,
                    )
                }

                return transaction
            } else {
                const transaction = await this.client
                    .send<TransactionDto, CreateTransactionDto>(
                        'producer-create',
                        {
                            operation,
                            sum,
                            wallet_id,
                        },
                    )
                    .pipe(timeout(5000))
                    .toPromise()

                if (!transaction) {
                    throw new HttpException(
                        'Connect error',
                        HttpStatus.INTERNAL_SERVER_ERROR,
                    )
                }

                return transaction
            }
        } catch (error) {
            this.logger.error(error)

            throw error
        }
    }
}
