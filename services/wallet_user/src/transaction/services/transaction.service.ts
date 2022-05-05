import { Inject, Injectable, Logger } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { lastValueFrom, timeout } from 'rxjs'
import { CreateTransactionDto } from 'src/wallet/dtos/create-transaction.dto'
import { FindTransactionDto } from '../dtos/inputs/find-transaction.dto'
import { TransactionDto } from '../dtos/outputs/transaction.dto'

interface FindData {
    [key: string]: number
}

@Injectable()
export class TransactionService {
    private readonly _logger = new Logger(TransactionService.name)

    constructor(
        @Inject('rabbit-mq-module') private readonly client: ClientProxy,
    ) {}

    // QUERY

    async findAll(id?: number): Promise<TransactionDto[]> {
        try {
            const data: FindData = {}

            if (id) {
                data['id'] = id
            }

            const source$ = this.client
                .send<TransactionDto[], any>('producer-find-all', data)
                .pipe(timeout(5000))

            const transactions = await lastValueFrom(source$)

            return transactions
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    async findOne(id: number): Promise<TransactionDto> {
        try {
            const sourse$ = this.client
                .send<TransactionDto, FindTransactionDto>('producer-find-one', {
                    id,
                })
                .pipe(timeout(5000))

            const transaction = await lastValueFrom(sourse$)

            return transaction
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }

    async create(createDto: CreateTransactionDto): Promise<TransactionDto> {
        try {
            const { from, to, sum, operation, wallet_id } = createDto

            if (from && to) {
                const sourse$ = this.client
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

                const transaction = await lastValueFrom(sourse$)

                return transaction
            } else {
                const sourse$ = this.client
                    .send<TransactionDto, CreateTransactionDto>(
                        'producer-create',
                        {
                            operation,
                            sum,
                            wallet_id,
                        },
                    )
                    .pipe(timeout(5000))

                const transaction = await lastValueFrom(sourse$)

                return transaction
            }
        } catch (error) {
            this._logger.error(error, error.stack)

            throw error
        }
    }
}
